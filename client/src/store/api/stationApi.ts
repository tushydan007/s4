import { createApi } from "@reduxjs/toolkit/query/react";
import type { SecurityStation } from "@/types";
import { baseQueryWithReauth } from "./baseQuery";

interface NearestParams {
  lat: number;
  lng: number;
  radius?: number;
  limit?: number;
}

export const stationApi = createApi({
  reducerPath: "stationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Station"],
  endpoints: (builder) => ({
    getStations: builder.query<SecurityStation[], { type?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.type) searchParams.append("type", params.type);
        return `/stations/?${searchParams.toString()}`;
      },
      providesTags: ["Station"],
    }),

    getNearestStations: builder.query<SecurityStation[], NearestParams>({
      query: ({ lat, lng, radius = 50, limit = 10 }) =>
        `/stations/nearest/?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`,
    }),
  }),
});

export const { useGetStationsQuery, useGetNearestStationsQuery } = stationApi;
