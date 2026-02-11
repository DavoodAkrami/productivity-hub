import AIWorkspace from "@/components/AIWorkspace";

const AIChatPage = async ({ params }: { params: Promise<{ chatId: string }> }) => {
    const { chatId } = await params;
    return <AIWorkspace routeChatId={chatId} />;
};

export default AIChatPage;
