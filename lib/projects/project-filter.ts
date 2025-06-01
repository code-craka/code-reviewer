/**
 * Enhanced project filtering and sorting utilities
 */

import { Project } from "@/types/index"; // Using the existing Project type

// Define filter types with proper typing
export type ProjectSortField = "name" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";
export type ProjectFilterField = "name" | "description" | "teamId" | "status";

export interface ProjectFilterOptions {
  searchTerm?: string;
  teamId?: string;
  sortBy?: ProjectSortField;
  sortDirection?: SortDirection;
  limit?: number;
  offset?: number;
}

/**
 * Sort projects based on sort field and direction
 */
export const sortProjects = (
  projects: Project[],
  sortBy: ProjectSortField = "updatedAt",
  sortDirection: SortDirection = "desc",
): Project[] => {
  return [...projects].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "updatedAt":
        comparison =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      default:
        comparison =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });
};

/**
 * Filter projects based on search term and other filter options
 */
export const filterProjects = (
  projects: Project[],
  options: ProjectFilterOptions,
): Project[] => {
  let filtered = [...projects];

  // Filter by search term
  if (options.searchTerm) {
    const term = options.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (project) =>
        project.name.toLowerCase().includes(term) ||
        (project.description &&
          project.description.toLowerCase().includes(term)),
    );
  }

  // Filter by team
  if (options.teamId) {
    filtered = filtered.filter((project) => project.teamId === options.teamId);
  }

  // Sort the results
  if (options.sortBy) {
    filtered = sortProjects(
      filtered,
      options.sortBy,
      options.sortDirection || "desc",
    );
  }

  // Apply pagination if specified
  if (options.limit !== undefined) {
    const offset = options.offset || 0;
    filtered = filtered.slice(offset, offset + options.limit);
  }

  return filtered;
};

/**
 * Type definition for the project query structure
 */
interface ProjectQueryOptions {
  where: {
    OR?: Array<Record<string, unknown>>;
    teamId?: string;
    [key: string]: unknown;
  };
  orderBy: Record<string, "asc" | "desc">;
  take?: number;
  skip?: number;
}

/**
 * Create a database query with filters
 * This is used in server actions to create the appropriate Prisma query
 */
export const buildProjectQuery = (options: ProjectFilterOptions) => {
  // Base query object for Prisma
  const query: ProjectQueryOptions = {
    where: {},
    orderBy: {},
  };

  // Apply search term filter
  if (options.searchTerm) {
    query.where.OR = [
      { name: { contains: options.searchTerm, mode: "insensitive" } },
      { description: { contains: options.searchTerm, mode: "insensitive" } },
    ];
  }

  // Apply team filter
  if (options.teamId) {
    query.where.teamId = options.teamId;
  }

  // Apply sorting
  if (options.sortBy) {
    query.orderBy[options.sortBy] = options.sortDirection || "desc";
  } else {
    query.orderBy.updatedAt = "desc";
  }

  // Apply pagination
  if (options.limit !== undefined) {
    query.take = options.limit;
    query.skip = options.offset || 0;
  }

  return query;
};
