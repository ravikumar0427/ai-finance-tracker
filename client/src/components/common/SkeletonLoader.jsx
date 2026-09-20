import React from 'react';

export const CardSkeleton = () => (
  <div className="rounded-xl border bg-white p-5 shadow-sm animate-pulse">
    <div className="h-4 w-28 bg-slate-200 rounded mb-3"></div>
    <div className="h-8 w-36 bg-slate-300 rounded mb-2"></div>
    <div className="h-3 w-20 bg-slate-100 rounded"></div>
  </div>
);

export const ChartSkeleton = ({ height = 'h-72' }) => (
  <div className={`rounded-xl border bg-white p-5 shadow-sm animate-pulse ${height} flex flex-col justify-between`}>
    <div className="h-5 w-40 bg-slate-200 rounded"></div>
    <div className="flex items-end justify-between h-44 gap-2 pt-6">
      <div className="w-full bg-slate-100 rounded-t h-20"></div>
      <div className="w-full bg-slate-200 rounded-t h-32"></div>
      <div className="w-full bg-slate-100 rounded-t h-24"></div>
      <div className="w-full bg-slate-200 rounded-t h-40"></div>
      <div className="w-full bg-slate-100 rounded-t h-28"></div>
      <div className="w-full bg-slate-200 rounded-t h-36"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="rounded-xl border bg-white shadow-sm overflow-hidden animate-pulse">
    <div className="h-12 bg-slate-100 border-b flex items-center px-4 gap-4">
      <div className="h-4 w-24 bg-slate-300 rounded"></div>
      <div className="h-4 w-32 bg-slate-300 rounded"></div>
      <div className="h-4 w-20 bg-slate-300 rounded"></div>
      <div className="h-4 w-20 bg-slate-300 rounded"></div>
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="h-4 w-28 bg-slate-200 rounded"></div>
          <div className="h-4 w-36 bg-slate-200 rounded"></div>
          <div className="h-4 w-16 bg-slate-200 rounded"></div>
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export const InsightSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-16 rounded-lg bg-sky-50 border border-sky-100 p-4">
      <div className="h-4 bg-sky-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-sky-100 rounded w-1/2"></div>
    </div>
    <div className="h-16 rounded-lg bg-sky-50 border border-sky-100 p-4">
      <div className="h-4 bg-sky-200 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-sky-100 rounded w-1/3"></div>
    </div>
    <div className="h-16 rounded-lg bg-sky-50 border border-sky-100 p-4">
      <div className="h-4 bg-sky-200 rounded w-4/5 mb-2"></div>
      <div className="h-3 bg-sky-100 rounded w-2/5"></div>
    </div>
  </div>
);
