import AIWorkspace from "@/components/AIWorkspace";

const AIChatPage = ({ params }: { params: { chatId: string } }) => {
    const { chatId } = params;
    return <AIWorkspace routeChatId={chatId} />;
};

export default AIChatPage;
