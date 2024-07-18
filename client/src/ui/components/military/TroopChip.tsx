import { ArmyInfo } from "@/hooks/helpers/useArmies";
import { ResourceIcon } from "@/ui/elements/ResourceIcon";
import { currencyFormat } from "@/ui/utils/utils";

export const TroopMenuRow = ({ army, className }: { army: ArmyInfo; className?: string }) => {
  return (
    <div className={`grid w-full grid-cols-3 gap-2 relative w-full text-gold font-bold ${className}`}>
      <div className="px-2 py-1 bg-gold/10 clip-angled-sm flex flex-col justify-between gap-2 border border-gold/10">
        <ResourceIcon withTooltip={false} resource={"Crossbowman"} size="lg" />
        <div className="text-green text-xs self-center">{currencyFormat(army.troops.crossbowman_count, 0)}</div>
      </div>
      <div className="px-2 py-1 bg-gold/10 clip-angled-sm flex flex-col justify-between gap-2 border border-gold/10">
        <ResourceIcon withTooltip={false} resource={"Knight"} size="lg" />
        <div className="text-green text-xs self-center">{currencyFormat(army.troops.knight_count, 0)}</div>
      </div>
      <div className="px-2 py-1 bg-gold/10 clip-angled-sm flex flex-col justify-between gap-2 border border-gold/10">
        <ResourceIcon withTooltip={false} resource={"Paladin"} size="lg" />
        <div className="text-green text-xs self-center">{currencyFormat(army.troops.paladin_count, 0)}</div>
      </div>
    </div>
  );
};
