import { createApi } from "@reduxjs/toolkit/query/react";
import type { Report, PaginatedResponse } from "@/types";
import { baseQueryWithReauth } from "./baseQuery";

interface ReportFilters {
  category?: string;
  min_lat?: number;
  max_lat?: number;
  min_lng?: number;
  max_lng?: number;
  page?: number;
}

export const reportApi = createApi({
  reducerPath: "reportApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Report"],
  endpoints: (builder) => ({
    getReports: builder.query<PaginatedResponse<Report>, ReportFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
        }
        return `/reports/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "Report" as const,
                id,
              })),
              { type: "Report", id: "LIST" },
            ]
          : [{ type: "Report", id: "LIST" }],
    }),

    getReport: builder.query<Report, string>({
      query: (id) => `/reports/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Report", id }],
    }),

    createReport: builder.mutation<Report, FormData>({
      query: (data) => ({
        url: "/reports/create/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Report", id: "LIST" }],
    }),

    deleteReport: builder.mutation<void, string>({
      query: (id) => ({
        url: `/reports/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Report", id },
        { type: "Report", id: "LIST" },
        { type: "Report", id: "USER_LIST" },
      ],
    }),

    getUserReports: builder.query<PaginatedResponse<Report>, void>({
      query: () => "/reports/my-reports/",
      providesTags: [{ type: "Report", id: "USER_LIST" }],
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetReportQuery,
  useCreateReportMutation,
  useDeleteReportMutation,
  useGetUserReportsQuery,
} = reportApi;
