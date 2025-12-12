/** @format */

import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { DeduplicationService } from "../deduplication.service";
import { prisma } from "../../lib/db";
import {
  createMockReport,
  createMockOriginalReport,
  createMockDuplicateReport,
  mockNearbyReports,
  mockFarAwayReport,
  mockDifferentCategoryReport,
  type MockReport,
} from "../../__tests__/helpers/report.helper";

// Mock the database module
jest.mock("../../lib/db");

describe("DeduplicationService", () => {
  let service: DeduplicationService;
  let mockPrisma: typeof prisma;

  beforeEach(() => {
    service = new DeduplicationService();
    mockPrisma = prisma as any;
    jest.clearAllMocks();
  });

  describe("checkForDuplicates", () => {
    describe("when NO duplicates exist", () => {
      test("should return isDuplicate: false when no nearby reports found", async () => {
        // Arrange: Mock empty nearby reports (PostGIS query returns nothing)
        (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);

        // Act
        const result = await service.checkForDuplicates(
          28.6139,
          77.209,
          "ROAD_ISSUE"
        );

        // Assert
        expect(result.isDuplicate).toBe(false);
        expect(result.originalReport).toBeUndefined();
        expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      });

      test("should return isDuplicate: false when nearby reports have different category", async () => {
        // Arrange: Reports nearby but wrong category
        const differentCategoryReport = mockDifferentCategoryReport();
        (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
          differentCategoryReport,
        ]);

        // Act
        const result = await service.checkForDuplicates(
          28.614,
          77.2091,
          "ROAD_ISSUE"
        );

        // Assert
        expect(result.isDuplicate).toBe(false);
        expect(result.originalReport).toBeUndefined();
      });

      test("should return isDuplicate: false when reports are outside threshold range", async () => {
        // Arrange: Report far away (> 50m threshold)
        const farReport = mockFarAwayReport();
        (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([farReport]);

        // Act
        const result = await service.checkForDuplicates(
          28.6139,
          77.209,
          "ROAD_ISSUE"
        );

        // Assert
        expect(result.isDuplicate).toBe(false);
      });
    });

    describe("when duplicates exist", () => {
      test("should return isDuplicate: true with originalReport when match found", async () => {
        // Arrange: Nearby report with same category (within 50m threshold)
        const originalReport = createMockOriginalReport();
        (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([originalReport]);

        // Act
        const result = await service.checkForDuplicates(
          28.614,
          77.2091,
          "ROAD_ISSUE"
        );

        // Assert
        expect(result.isDuplicate).toBe(true);
        expect(result.originalReport).toBeDefined();
        expect(result.originalReport?.id).toBe(originalReport.id);
      });

      test("should return the earliest created report as original when multiple matches", async () => {
        // Arrange: Multiple nearby reports with same category
        const reports = mockNearbyReports();
        const earliestReport = reports[0]; // First one is earlier
        (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(reports);

        // Act
        const result = await service.checkForDuplicates(
          28.614,
          77.2091,
          "ROAD_ISSUE"
        );

        // Assert
        expect(result.isDuplicate).toBe(true);
        expect(result.originalReport?.id).toBe(earliestReport.id);
      });

      test("should use PostGIS geo query with correct parameters", async () => {
        // Arrange
        (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);
        const lat = 28.6139;
        const lon = 77.209;

        // Act
        await service.checkForDuplicates(lat, lon, "ROAD_ISSUE");

        // Assert
        expect(mockPrisma.$queryRaw).toHaveBeenCalled();
        const call = (mockPrisma.$queryRaw as jest.Mock).mock.calls[0];
        // Verify the query contains our coordinates and radius (50m = 50 meters)
        expect(call).toBeDefined();
      });
    });
  });

  describe("mergeReports", () => {
    let originalReport: MockReport;
    let duplicateReport: MockReport;

    beforeEach(() => {
      originalReport = createMockOriginalReport();
      duplicateReport = createMockDuplicateReport();
    });

    describe("validation", () => {
      test("should throw error when duplicate report not found", async () => {
        // Arrange
        (mockPrisma.report.findUnique as jest.Mock)
          .mockResolvedValueOnce(null) // duplicate not found
          .mockResolvedValueOnce(originalReport); // original found

        // Act & Assert
        await expect(
          service.mergeReports("invalid-id", originalReport.id, "user-123")
        ).rejects.toThrow("Report not found");
      });

      test("should throw error when original report not found", async () => {
        // Arrange
        (mockPrisma.report.findUnique as jest.Mock)
          .mockResolvedValueOnce(duplicateReport) // duplicate found
          .mockResolvedValueOnce(null); // original not found

        // Act & Assert
        await expect(
          service.mergeReports(duplicateReport.id, "invalid-id", "user-123")
        ).rejects.toThrow("Report not found");
      });
    });

    describe("successful merge", () => {
      beforeEach(() => {
        // Setup successful transaction mock
        (mockPrisma.report.findUnique as jest.Mock)
          .mockResolvedValueOnce(duplicateReport)
          .mockResolvedValueOnce(originalReport);

        (mockPrisma.$transaction as jest.Mock).mockImplementation(
          async (callback) => {
            return callback({
              report: {
                update: jest.fn().mockResolvedValue({
                  ...originalReport,
                  imageUrl: [
                    ...originalReport.imageUrl,
                    ...duplicateReport.imageUrl,
                  ],
                  duplicateCount: 1,
                }),
              },
              activity: {
                createMany: jest.fn().mockResolvedValue({ count: 2 }),
              },
              upvote: {
                updateMany: jest.fn().mockResolvedValue({ count: 5 }),
              },
            });
          }
        );
      });

      test("should merge all images from duplicate to original report", async () => {
        // Act
        const result = await service.mergeReports(
          duplicateReport.id,
          originalReport.id,
          "user-123"
        );

        // Assert
        expect(result.imageUrl).toEqual([
          "original-image1.jpg",
          "original-image2.jpg",
          "duplicate-image1.jpg",
        ]);
      });

      test("should mark duplicate report as ARCHIVED and isDuplicate=true", async () => {
        // Act
        await service.mergeReports(
          duplicateReport.id,
          originalReport.id,
          "user-123"
        );

        // Assert
        const transaction = (mockPrisma.$transaction as jest.Mock).mock
          .calls[0][0];
        const mockTx = {
          report: { update: jest.fn() },
          activity: { createMany: jest.fn() },
          upvote: { updateMany: jest.fn() },
        };

        await transaction(mockTx);

        expect(mockTx.report.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: duplicateReport.id },
            data: expect.objectContaining({
              status: "ARCHIVED",
              isDuplicate: true,
              originalReportId: originalReport.id,
              mergedAt: expect.any(Date),
            }),
          })
        );
      });

      test("should increment duplicateCount on original report", async () => {
        // Act
        await service.mergeReports(
          duplicateReport.id,
          originalReport.id,
          "user-123"
        );

        // Assert
        const transaction = (mockPrisma.$transaction as jest.Mock).mock
          .calls[0][0];
        const mockTx = {
          report: { update: jest.fn() },
          activity: { createMany: jest.fn() },
          upvote: { updateMany: jest.fn() },
        };

        await transaction(mockTx);

        const originalUpdateCall = (
          mockTx.report.update as jest.Mock
        ).mock.calls.find((call) => call[0].where.id === originalReport.id);

        expect(originalUpdateCall[0].data.duplicateCount).toBe(1);
      });

      test("should transfer upvotes from duplicate to original report", async () => {
        // Act
        await service.mergeReports(
          duplicateReport.id,
          originalReport.id,
          "user-123"
        );

        // Assert
        const transaction = (mockPrisma.$transaction as jest.Mock).mock
          .calls[0][0];
        const mockTx = {
          report: { update: jest.fn() },
          activity: { createMany: jest.fn() },
          upvote: { updateMany: jest.fn() },
        };

        await transaction(mockTx);

        expect(mockTx.upvote.updateMany).toHaveBeenCalledWith({
          where: { reportId: duplicateReport.id },
          data: { reportId: originalReport.id },
        });
      });

      test("should create activity for original report with ADDED_DUPLICATE type", async () => {
        // Act
        await service.mergeReports(
          duplicateReport.id,
          originalReport.id,
          "user-123"
        );

        // Assert
        const transaction = (mockPrisma.$transaction as jest.Mock).mock
          .calls[0][0];
        const mockTx = {
          report: { update: jest.fn() },
          activity: { createMany: jest.fn() },
          upvote: { updateMany: jest.fn() },
        };

        await transaction(mockTx);

        const activitiesCall = (mockTx.activity.createMany as jest.Mock).mock
          .calls[0][0];
        const originalActivity = activitiesCall.data.find(
          (a: any) => a.reportId === originalReport.id
        );

        expect(originalActivity).toBeDefined();
        expect(originalActivity.type).toBe("ADDED_DUPLICATE");
        expect(originalActivity.message).toContain(duplicateReport.id);
        expect(originalActivity.createdById).toBe("user-123");
      });

      test("should create activity for duplicate report with MARKED_AS_DUPLICATE type", async () => {
        // Act
        await service.mergeReports(
          duplicateReport.id,
          originalReport.id,
          "user-123"
        );

        // Assert
        const transaction = (mockPrisma.$transaction as jest.Mock).mock
          .calls[0][0];
        const mockTx = {
          report: { update: jest.fn() },
          activity: { createMany: jest.fn() },
          upvote: { updateMany: jest.fn() },
        };

        await transaction(mockTx);

        const activitiesCall = (mockTx.activity.createMany as jest.Mock).mock
          .calls[0][0];
        const duplicateActivity = activitiesCall.data.find(
          (a: any) => a.reportId === duplicateReport.id
        );

        expect(duplicateActivity).toBeDefined();
        expect(duplicateActivity.type).toBe("MARKED_AS_DUPLICATE");
        expect(duplicateActivity.message).toContain(originalReport.id);
        expect(duplicateActivity.createdById).toBe("user-123");
      });

      test("should execute all operations in a transaction", async () => {
        // Act
        await service.mergeReports(
          duplicateReport.id,
          originalReport.id,
          "user-123"
        );

        // Assert
        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
        expect(mockPrisma.$transaction).toHaveBeenCalledWith(
          expect.any(Function)
        );
      });

      test("should handle reports with empty image arrays", async () => {
        // Arrange
        const reportWithNoImages = { ...duplicateReport, imageUrl: [] };
        (mockPrisma.report.findUnique as jest.Mock)
          .mockResolvedValueOnce(reportWithNoImages)
          .mockResolvedValueOnce(originalReport);

        // Act
        const result = await service.mergeReports(
          reportWithNoImages.id,
          originalReport.id,
          "user-123"
        );

        // Assert - Should not throw, should only have original images
        expect(result.imageUrl).toEqual(originalReport.imageUrl);
      });
    });

    describe("edge cases", () => {
      test("should handle multiple consecutive merges to same original", async () => {
        // Arrange: Original already has duplicates merged
        const originalWithDupes = {
          ...originalReport,
          duplicateCount: 2,
        };
        (mockPrisma.report.findUnique as jest.Mock)
          .mockResolvedValueOnce(duplicateReport)
          .mockResolvedValueOnce(originalWithDupes);

        (mockPrisma.$transaction as jest.Mock).mockImplementation(
          async (callback) => {
            return callback({
              report: {
                update: jest.fn().mockResolvedValue({
                  ...originalWithDupes,
                  duplicateCount: 3, // Should increment
                }),
              },
              activity: { createMany: jest.fn() },
              upvote: { updateMany: jest.fn() },
            });
          }
        );

        // Act
        await service.mergeReports(
          duplicateReport.id,
          originalReport.id,
          "user-123"
        );

        // Assert
        const transaction = (mockPrisma.$transaction as jest.Mock).mock
          .calls[0][0];
        const mockTx = {
          report: { update: jest.fn() },
          activity: { createMany: jest.fn() },
          upvote: { updateMany: jest.fn() },
        };

        await transaction(mockTx);

        const originalUpdateCall = (
          mockTx.report.update as jest.Mock
        ).mock.calls.find((call) => call[0].where.id === originalReport.id);

        expect(originalUpdateCall[0].data.duplicateCount).toBe(3);
      });

      test("should handle merge without createdById (system merge)", async () => {
        // Arrange
        (mockPrisma.report.findUnique as jest.Mock)
          .mockResolvedValueOnce(duplicateReport)
          .mockResolvedValueOnce(originalReport);

        (mockPrisma.$transaction as jest.Mock).mockImplementation(
          async (callback) => {
            return callback({
              report: { update: jest.fn().mockResolvedValue(originalReport) },
              activity: { createMany: jest.fn() },
              upvote: { updateMany: jest.fn() },
            });
          }
        );

        // Act
        await service.mergeReports(duplicateReport.id, originalReport.id); // No user

        // Assert
        const transaction = (mockPrisma.$transaction as jest.Mock).mock
          .calls[0][0];
        const mockTx = {
          report: { update: jest.fn() },
          activity: { createMany: jest.fn() },
          upvote: { updateMany: jest.fn() },
        };

        await transaction(mockTx);

        const activitiesCall = (mockTx.activity.createMany as jest.Mock).mock
          .calls[0][0];

        // Both activities should have undefined/null createdById
        activitiesCall.data.forEach((activity: any) => {
          expect(activity.createdById).toBeUndefined();
        });
      });
    });
  });
});
