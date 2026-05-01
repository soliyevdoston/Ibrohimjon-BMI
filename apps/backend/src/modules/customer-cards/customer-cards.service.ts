import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CardProvider } from '@prisma/client';
import { PrismaService } from 'src/common/prisma.service';

interface AddCardInput {
  cardNumber: string; // full PAN — never persisted
  holderName: string;
  expiryMonth: number;
  expiryYear: number;
  setDefault?: boolean;
}

@Injectable()
export class CustomerCardsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.customerCard.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: this.publicFields(),
    });
  }

  async add(userId: string, input: AddCardInput) {
    const cleaned = (input.cardNumber || '').replace(/\s+/g, '');

    if (!/^\d{13,19}$/.test(cleaned)) {
      throw new BadRequestException('Karta raqami noto`g`ri (13–19 raqam bo`lishi kerak)');
    }
    if (!luhnValid(cleaned)) {
      throw new BadRequestException('Karta raqami yaroqsiz (Luhn check)');
    }
    if (!input.holderName || input.holderName.trim().length < 3) {
      throw new BadRequestException('Karta egasi ismini kiriting');
    }
    const month = Number(input.expiryMonth);
    const year = Number(input.expiryYear);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Amal qilish oyi noto`g`ri (1–12)');
    }
    if (!Number.isInteger(year) || year < 2025 || year > 2050) {
      throw new BadRequestException('Amal qilish yili noto`g`ri');
    }
    const now = new Date();
    const expEnd = new Date(year, month, 0, 23, 59, 59);
    if (expEnd.getTime() < now.getTime()) {
      throw new BadRequestException('Karta muddati o`tib ketgan');
    }

    const last4 = cleaned.slice(-4);
    const provider = detectProvider(cleaned);

    return this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.customerCard.count({
        where: { userId, isActive: true },
      });
      const shouldDefault = input.setDefault === true || existingCount === 0;

      if (shouldDefault) {
        await tx.customerCard.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.customerCard.create({
        data: {
          userId,
          last4,
          holderName: input.holderName.trim().toUpperCase(),
          provider,
          expiryMonth: month,
          expiryYear: year,
          isDefault: shouldDefault,
          providerToken: `demo-tok-${Math.random().toString(36).slice(2, 12)}`,
        },
        select: this.publicFields(),
      });
    });
  }

  async setDefault(userId: string, cardId: string) {
    const card = await this.prisma.customerCard.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Karta topilmadi');
    if (card.userId !== userId) throw new ForbiddenException('Bu sizning kartangiz emas');
    if (!card.isActive) throw new BadRequestException('Karta o`chirilgan');

    return this.prisma.$transaction(async (tx) => {
      await tx.customerCard.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
      return tx.customerCard.update({
        where: { id: cardId },
        data: { isDefault: true },
        select: this.publicFields(),
      });
    });
  }

  async remove(userId: string, cardId: string) {
    const card = await this.prisma.customerCard.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Karta topilmadi');
    if (card.userId !== userId) throw new ForbiddenException('Bu sizning kartangiz emas');

    return this.prisma.$transaction(async (tx) => {
      await tx.customerCard.update({
        where: { id: cardId },
        data: { isActive: false, isDefault: false },
      });

      // If we just removed the default, promote the most recent active card.
      if (card.isDefault) {
        const replacement = await tx.customerCard.findFirst({
          where: { userId, isActive: true },
          orderBy: { createdAt: 'desc' },
        });
        if (replacement) {
          await tx.customerCard.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }

      return { ok: true };
    });
  }

  async assertOwnership(userId: string, cardId: string) {
    const card = await this.prisma.customerCard.findUnique({ where: { id: cardId } });
    if (!card || card.userId !== userId || !card.isActive) {
      throw new BadRequestException('Tanlangan karta topilmadi yoki o`chirilgan');
    }
    return card;
  }

  private publicFields() {
    return {
      id: true,
      last4: true,
      holderName: true,
      provider: true,
      expiryMonth: true,
      expiryYear: true,
      isDefault: true,
      createdAt: true,
    } as const;
  }
}

function luhnValid(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = num.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function detectProvider(num: string): CardProvider {
  if (/^8600/.test(num)) return CardProvider.UZCARD;
  if (/^9860/.test(num)) return CardProvider.HUMO;
  if (/^4/.test(num)) return CardProvider.VISA;
  if (/^(5[1-5]|2[2-7])/.test(num)) return CardProvider.MASTERCARD;
  return CardProvider.UNKNOWN;
}
