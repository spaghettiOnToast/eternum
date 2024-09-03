import { useDojo } from "@/hooks/context/DojoContext";
import useUIStore from "@/hooks/store/useUIStore";
import { prompt } from "@/ui/components/navigation/Config";
import { OSWindow } from "@/ui/components/navigation/OSWindow";
import { defineComponentSystem } from "@dojoengine/recs";
import { useEffect, useRef, useState } from "react";

export const HaikuMessages = () => {
  const togglePopup = useUIStore((state) => state.togglePopup);
  const isOpen = useUIStore((state) => state.isPopupOpen(prompt));

  const { setup, network } = useDojo();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [promptMessages, setPromptMessages] = useState<Array<{ message: string; timestamp: Date }>>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [promptMessages]);

  useEffect(() => {
    defineComponentSystem(network.world, setup.components.PromptMessage, (update) => {
      const newMessage = {
        message: update.value[0]?.prompt,
        timestamp: new Date((update.value[0]?.timestamp || 0) * 1000),
      };

      setPromptMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, newMessage];
        return updatedMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      });
    });
  }, []);

  return (
    <OSWindow width="600px" onClick={() => togglePopup(prompt)} show={isOpen} title={"Battle Lore"}>
      <h2 className="mb-7 pb-4 bg-map text-center text-3xl tracking-wider">Battle Lore</h2>
      <div className="max-h-[200px] overflow-y-auto pr-2.5 flex flex-col-reverse">
        <div ref={messagesEndRef} />
        {promptMessages.map((messageObj, index) => (
          <div key={index} className="my-2.5 p-4 shadow-md rounded-lg relative">
            <div className="whitespace-pre-wrap font-normal leading-relaxed text-center">{messageObj.message}</div>
            <div className="text-xs mt-3 text-right italic">{messageObj.timestamp.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </OSWindow>
  );
};
