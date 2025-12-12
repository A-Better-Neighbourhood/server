/** @format */

// Test helpers for Report mocking
// Note: These types will match after schema migration

export type ReportCategory =
  | "ROAD_ISSUE"
  | "GARBAGE"
  | "STREET_LIGHT"
  | "WATER_LEAK"
  | "NOISE_COMPLAINT"
  | "OTHER";

export type ActivityType =
  | "CREATED"
  | "COMMENT_ADDED"
  | "AUTHORITY_COMMENTED"
  | "STATUS_UPDATED"
  | "ADDED_DUPLICATE"
  | "MARKED_RESOLVED"
  | "MARKED_AS_DUPLICATE";

export type ReportStatus = "RESOLVED" | "PENDING" | "IN_PROGRESS" | "ARCHIVED";

export interface MockReport {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string[];
  latitude: number;
  longitude: number;
  status: ReportStatus;
  category: ReportCategory;
  createdAt: Date;
  creatorId: string;
  isDuplicate: boolean;
  originalReportId: string | null;
  duplicateCount: number;
  mergedAt: Date | null;
}

export const createMockReport = (
  overrides?: Partial<MockReport>
): MockReport => ({
  id: "report-123",
  title: "Test Report",
  description: "Test description",
  imageUrl: ["image1.jpg"],
  latitude: 28.6139,
  longitude: 77.209,
  status: "PENDING",
  category: "ROAD_ISSUE",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  creatorId: "user-123",
  isDuplicate: false,
  originalReportId: null,
  duplicateCount: 0,
  mergedAt: null,
  ...overrides,
});

export const createMockOriginalReport = (
  overrides?: Partial<MockReport>
): MockReport =>
  createMockReport({
    id: "original-report-123",
    title: "Original Report",
    imageUrl: ["original-image1.jpg", "original-image2.jpg"],
    latitude: 28.6139,
    longitude: 77.209,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    isDuplicate: false,
    duplicateCount: 0,
    ...overrides,
  });

export const createMockDuplicateReport = (
  overrides?: Partial<MockReport>
): MockReport =>
  createMockReport({
    id: "duplicate-report-456",
    title: "Duplicate Report",
    imageUrl: ["duplicate-image1.jpg"],
    latitude: 28.614, // Very close to original (within 50m)
    longitude: 77.2091,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    isDuplicate: false,
    category: "ROAD_ISSUE", // Same category
    ...overrides,
  });

export const mockNearbyReports = (): MockReport[] => [
  createMockReport({
    id: "nearby-1",
    latitude: 28.614,
    longitude: 77.2091,
    category: "ROAD_ISSUE",
    createdAt: new Date("2025-01-01T10:00:00Z"),
  }),
  createMockReport({
    id: "nearby-2",
    latitude: 28.6141,
    longitude: 77.2092,
    category: "ROAD_ISSUE",
    createdAt: new Date("2025-01-01T11:00:00Z"),
  }),
];

export const mockFarAwayReport = (): MockReport =>
  createMockReport({
    id: "far-away",
    latitude: 28.7041, // ~10km away
    longitude: 77.1025,
    category: "ROAD_ISSUE",
  });

export const mockDifferentCategoryReport = (): MockReport =>
  createMockReport({
    id: "different-category",
    latitude: 28.614, // Close but different category
    longitude: 77.2091,
    category: "GARBAGE",
  });
