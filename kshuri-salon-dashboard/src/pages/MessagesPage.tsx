import { useParams, useNavigate } from "react-router-dom";
import { ThreadsList, ChatThread } from "@kshuri/ui";
import { useAuth } from "@/lib/auth-context";

export default function MessagesPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user?.id) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100vh-56px)] border border-border/40 rounded-xl overflow-hidden mx-4 lg:mx-6 my-4">
      <aside className="border-r border-border/30">
        <ThreadsList
          selectedThreadId={threadId}
          onSelect={(id) => navigate(`/messages/${id}`)}
        />
      </aside>
      <section className="flex flex-col">
        {threadId ? (
          <ChatThread threadId={threadId} currentUserId={user.id} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a conversation.
          </div>
        )}
      </section>
    </div>
  );
}
