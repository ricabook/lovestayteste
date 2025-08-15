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
    <div className={cn("flex w-full items-end gap-2 mb-4", mine ? "justify-end" : "justify-start")}>
      {!mine && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarUrl ?? undefined} alt={name ?? "avatar"} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm break-words",
          mine 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{body}</div>
        <div className={cn(
          "mt-2 text-[10px] opacity-70 text-right", 
          mine ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {format(new Date(created_at), "HH:mm")}
        </div>
      </div>
      {mine && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarUrl ?? undefined} alt={name ?? "avatar"} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
