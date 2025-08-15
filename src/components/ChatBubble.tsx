
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  body: string;
  created_at: string;
  sender_id: string;
};

export default function ChatBubble({ body, created_at, sender_id }: Props) {
  const { user } = useAuth();
  const mine = user?.id === sender_id;
  return (
    <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%] rounded-2xl px-4 py-2 my-1 text-sm shadow-sm",
        mine ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
        <div className="whitespace-pre-wrap">{body}</div>
        <div className={cn("mt-1 text-[10px] opacity-70", mine ? "text-primary-foreground" : "text-foreground")}>
          {format(new Date(created_at), "dd/MM/yyyy HH:mm")}
        </div>
      </div>
    </div>
  );
}
