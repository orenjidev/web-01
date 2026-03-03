"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPurchaseHistory } from "@/lib/data/itemshop.data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const todayString = () => {
  return new Date().toISOString().split("T")[0];
};

export default function PurchaseHistoryDialog({ open, onOpenChange }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState(todayString());
  const [endDate, setEndDate] = useState(todayString());

  const pageSize = 25;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const loadHistory = async (customPage?: number) => {
    setLoading(true);

    const res = await getPurchaseHistory({
      page: customPage ?? page,
      pageSize,
      startDate,
      endDate,
    });

    if (res.ok) {
      setData(res.data.items);
      setTotal(res.data.total);
    }

    setLoading(false);
  };

  // Reset dates & page when dialog opens
  useEffect(() => {
    if (open) {
      const today = todayString();
      setStartDate(today);
      setEndDate(today);
      setPage(1);
      loadHistory(1);
    }
  }, [open]);

  // Load when page changes
  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [page]);

  const handleFilter = async () => {
    setPage(1);
    await loadHistory(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!max-w-[95vw] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Purchase History</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-4 items-end mb-4">
          <div>
            <label className="text-sm block mb-1">Start Date</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm block mb-1">End Date</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <Button onClick={handleFilter}>Apply</Button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="p-2 text-left">Item Name</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Gift</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No purchase history found
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.idx} className="border-t hover:bg-muted/40">
                    <td className="p-2">{item.itemName}</td>
                    <td className="p-2">{item.ItemMoney}</td>
                    <td className="p-2">
                      {new Date(item.Date).toLocaleString()}
                    </td>
                    <td className="p-2">
                      {item.IsGift === 1
                        ? `Gift → ${item.ReceiverUserID}`
                        : "No"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div>
            Page {page} of {totalPages}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>

            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
