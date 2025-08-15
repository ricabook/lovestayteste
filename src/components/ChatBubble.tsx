import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  body: string;
  created_at: string;
  sender_id: string;
  avatarUrl?: string | null;
  name?: string | null;
};

export default function ChatBubble({ body, created_at, sender_id, avatarUrl, name }: Props) {
  const { user } = useAuth();
  const mine = user?.id === sender_id;
  const initials = (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

  return (
    <div className={cn("flex w-full items-end gap-2", mine ? "justify-end" : "justify-start")}>
      {!mine && (
        <Avatar className="h-7 w-7">
          <AvatarImage src={avatarUrl ?? undefined} alt={name ?? "avatar"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 my-1 text-sm shadow-sm",
          mine ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
        )}
      >
        <div className="whitespace-pre-wrap">{body}</div>
        <div className={cn("mt-1 text-[10px] opacity-70", mine ? "text-primary-foreground" : "text-foreground")}>
          {format(new Date(created_at), "dd/MM/yyyy HH:mm")}
        </div>
      </div>
      {mine && (
        <Avatar className="h-7 w-7">
          <AvatarImage src={avatarUrl ?? undefined} alt={name ?? "avatar"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
