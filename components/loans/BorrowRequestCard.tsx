import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { BorrowRequest } from "@/types/loan";

export function BorrowRequestCard({
  request,
  onApprove,
  onDecline,
}: {
  request: BorrowRequest;
  onApprove?: () => void;
  onDecline?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-100">{request.user_book?.book?.title ?? "Untitled"}</p>
        <p className="truncate text-xs text-zinc-400">
          {request.requester_name} ({request.requester_email})
        </p>
        {request.message && <p className="mt-1 text-xs text-zinc-500">&ldquo;{request.message}&rdquo;</p>}
        <p className="mt-1 text-xs text-zinc-600">{format(new Date(request.created_at), "MMM d, yyyy")}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {request.status === "pending" ? (
          <>
            <Button className="h-10 flex-1 sm:flex-initial" onClick={onApprove}>
              Approve
            </Button>
            <Button className="h-10 flex-1 sm:flex-initial" variant="ghost" onClick={onDecline}>
              Decline
            </Button>
          </>
        ) : (
          <Badge variant={request.status === "approved" ? "default" : "secondary"}>
            {request.status === "approved" ? "Approved" : "Declined"}
          </Badge>
        )}
      </div>
    </div>
  );
}
