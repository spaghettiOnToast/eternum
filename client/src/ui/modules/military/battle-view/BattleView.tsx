import { useArmyByArmyEntityId } from "@/hooks/helpers/useArmies";
import { useBattleManager } from "@/hooks/helpers/useBattles";
import { Realm, Structure } from "@/hooks/helpers/useStructures";
import { BattleViewInfo } from "@/hooks/store/types";
import useBlockchainStore from "@/hooks/store/useBlockchainStore";
import useUIStore from "@/hooks/store/useUIStore";
import { CombatTarget } from "@/types";
import { useMemo } from "react";
import { BattleFinisher } from "./BattleFinisher";
import { BattleStarter } from "./BattleStarter";
import { OngoingBattle } from "./OngoingBattle";

export const BattleView = () => {
  const battleView = useUIStore((state) => state.battleView);
  const selectedEntity = useUIStore((state) => state.selectedEntity);

  const currentDefaultTick = useBlockchainStore((state) => state.currentDefaultTick);

  const { attackers, defenders, structure } = useMemo(() => {
    return getArmiesAndStructure(battleView!);
  }, [battleView?.defenders]);

  const updatedAttacker = useArmyByArmyEntityId(BigInt(attackers?.[0] || 0n));
  const updatedDefender = useArmyByArmyEntityId(BigInt(defenders?.[0] || 0n));
  const { updatedBattle } = useBattleManager(BigInt(updatedDefender?.battle_id || 0n));

  const battleAdjusted = useMemo(() => {
    return updatedBattle.getUpdatedBattle(currentDefaultTick);
  }, [currentDefaultTick]);

  const elem = useMemo(() => {
    if (!attackers) return;
    if (updatedBattle.battleActive(currentDefaultTick)) {
      return (
        <OngoingBattle
          attackerArmy={updatedAttacker}
          defenderArmy={updatedDefender!}
          structure={structure}
          battleManager={updatedBattle}
          ownArmyEntityId={selectedEntity?.id}
        />
      );
    }
    if (battleAdjusted === undefined && selectedEntity) {
      return (
        <BattleStarter
          attackerArmy={updatedAttacker}
          attackerArmyHealth={BigInt(updatedAttacker.current)}
          defenderArmy={!structure ? updatedDefender : undefined}
          defenderArmyHealth={BigInt(updatedDefender?.current || 0)}
          structure={structure}
        />
      );
    }

    return (
      <BattleFinisher
        attackerArmy={updatedAttacker}
        attackerArmyHealth={
          battleAdjusted ? battleAdjusted.attack_army_health.current : BigInt(updatedAttacker.current)
        }
        defenderArmy={
          !structure
            ? updatedDefender
            : (battleAdjusted?.defence_army_health.current === undefined ? updatedDefender?.current || 0 : 0) > 0
            ? updatedDefender
            : undefined
        }
        defenderArmyHealth={
          battleAdjusted ? battleAdjusted.defence_army_health.current : BigInt(updatedDefender?.current || 0)
        }
        structure={structure}
        updatedBattle={updatedBattle}
      />
    );
  }, [updatedAttacker, updatedDefender, battleView, battleAdjusted, selectedEntity]);

  return elem;
};

const getArmiesAndStructure = (
  battleView: BattleViewInfo,
): {
  attackers: bigint[] | undefined;
  defenders: bigint[] | undefined;
  structure: Realm | Structure | undefined;
} => {
  if (battleView.defenders.type === CombatTarget.Army) {
    return {
      attackers: battleView.attackers,
      defenders: battleView.defenders.entities as bigint[],
      structure: undefined,
    };
  } else if (battleView.defenders.type === CombatTarget.Structure) {
    const target = battleView.defenders.entities as Realm | Structure;
    return {
      attackers: battleView.attackers,
      defenders: [BigInt(target.protector?.entity_id || 0n)],
      structure: target,
    };
  }
  return { attackers: undefined, defenders: undefined, structure: undefined };
};
