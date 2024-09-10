import { useDojo } from "@/hooks/context/DojoContext";
import { useEntityQuery } from "@dojoengine/react";
import { defineEnterQuery, getComponentValue, HasValue } from "@dojoengine/recs";
import { useEffect, useRef, useState } from "react";
import { take } from "rxjs";

export const HexHistory = ({ x, y }: { x: number; y: number }) => {
  const { setup } = useDojo();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [promptMessages, setPromptMessages] = useState<Array<{ message: string; timestamp: Date }>>([]);

  const battleStartEventIds = useEntityQuery([HasValue(setup.components.events.BattleStartEvent, { x, y })], {
    updateOnValueChange: false,
  });

  console.log(battleStartEventIds);
  useEffect(() => {
    const battleStartEvent = getComponentValue(
      setup.components.events.BattleStartEvent,
      battleStartEventIds[battleStartEventIds.length - 1],
    );
    console.log(battleStartEvent);
    const observable = defineEnterQuery(
      [
        HasValue(setup.components.PromptMessage, {
          event_id: battleStartEvent?.id,
          identity: BigInt("0xb3ff441a68610b30fd5e2abbf3a1548eb6ba6f3559f2862bf2dc757e5828ca"),
        }),
      ],
      { runOnInit: true },
    );

    const subscription = observable.pipe(take(1)).subscribe((update) => {
      const newMessage = {
        message: update.value[0]?.prompt,
        timestamp: new Date((update.value[0]?.timestamp || 0) * 1000),
      };
      console.log("heyyyyyy");
      setPromptMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, newMessage];
        return updatedMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      });
    });

    return () => subscription.unsubscribe();
  }, [battleStartEventIds]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [promptMessages]);

  return (
    <div>
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
    </div>
  );
};
