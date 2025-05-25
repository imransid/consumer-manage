import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaConsumerService } from '../../../../../prisma/prisma-hr.service';
import {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewPaginatedResult,
} from '../dto/review.input';
import { Review } from '../entities/review.entity';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaConsumerService) {}

  // ✅ Create Review
  async create(createReviewInput: CreateReviewInput): Promise<Review> {
    try {
      const authorExists = await this.prisma.user.findUnique({
        where: { id: createReviewInput.authorId },
      });
      if (!authorExists) {
        throw new NotFoundException(
          `Author with id ${createReviewInput.authorId} not found`,
        );
      }

      if (createReviewInput.targetId) {
        const targetExists = await this.prisma.user.findUnique({
          where: { id: createReviewInput.targetId },
        });
        if (!targetExists) {
          throw new NotFoundException(
            `Target with id ${createReviewInput.targetId} not found`,
          );
        }
      }

      return await this.prisma.review.create({
        data: {
          ...createReviewInput,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create review: ' + error.message,
      );
    }
  }

  // ✅ Find All Reviews with Pagination
  async findAll(page = 1, limit = 10): Promise<ReviewPaginatedResult> {
    try {
      const skip = (page - 1) * limit;

      const [reviews, totalCount] = await this.prisma.$transaction([
        this.prisma.review.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.review.count(),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        reviews,
        totalCount,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch reviews: ' + error.message,
      );
    }
  }

  // ✅ Find One Review by ID
  async findOne(id: string): Promise<Review> {
    try {
      const review = await this.prisma.review.findUnique({ where: { id } });
      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }
      return review;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to fetch review: ' + error.message,
      );
    }
  }

  // ✅ Update Review
  async update(
    id: string,
    updateReviewInput: UpdateReviewInput,
  ): Promise<Review> {
    try {
      await this.findOne(id); // Verify the review exists

      // Destructure authorId and targetId to handle nested updates for relations
      const { authorId, targetId, ...rest } = updateReviewInput;

      const data: any = {
        ...rest,
      };

      // Connect author relation if authorId provided
      if (authorId !== undefined) {
        data.author = { connect: { id: authorId } };
      }

      // Connect target relation if targetId provided
      if (targetId !== undefined) {
        data.target = { connect: { id: targetId } };
      }

      return await this.prisma.review.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to update review: ' + error.message,
      );
    }
  }

  // ✅ Delete Review
  async remove(id: string): Promise<Review> {
    try {
      await this.findOne(id); // Check if exists
      return await this.prisma.review.delete({ where: { id } });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to delete review: ' + error.message,
      );
    }
  }

  // ✅ Search Reviews (e.g., by content)
  async search(
    query: string,
    page = 1,
    limit = 10,
  ): Promise<ReviewPaginatedResult> {
    try {
      const skip = (page - 1) * limit;

      const [reviews, totalCount] = await this.prisma.$transaction([
        this.prisma.review.findMany({
          where: {
            OR: [{ comment: { contains: query, mode: 'insensitive' } }],
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.review.count({
          where: {
            OR: [{ comment: { contains: query, mode: 'insensitive' } }],
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        reviews,
        totalCount,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to search reviews: ' + error.message,
      );
    }
  }

  async getRatingsSummary(userId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { targetId: userId },
    });

    const total = reviews.length;
    const avgRating = total
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / total
      : 0;

    const breakdown = [0, 0, 0, 0, 0]; // index 0 = 1 star

    reviews.forEach((r) => {
      breakdown[r.rating - 1]++;
    });

    return {
      average: parseFloat(avgRating.toFixed(1)),
      total,
      breakdown,
    };
  }
}
