import { useDojo } from "@/hooks/context/DojoContext";
import { useOwnedEntitiesOnPosition, useResources } from "@/hooks/helpers/useResources";
import useBlockchainStore from "@/hooks/store/useBlockchainStore";
import Button from "@/ui/elements/Button";
import { getEntityIdFromKeys } from "@/ui/utils/utils";
import { EntityState, determineEntityState } from "@bibliothecadao/eternum";
import { getComponentValue } from "@dojoengine/recs";
import { useState } from "react";

type DepositResourcesProps = {
  entityId: bigint;
  battleInProgress?: boolean;
};

export const DepositResources = ({ entityId, battleInProgress }: DepositResourcesProps) => {
  const { account, setup } = useDojo();
  const [isLoading, setIsLoading] = useState(false);

  const { getResourcesFromBalance } = useResources();

  const inventoryResources = getResourcesFromBalance(entityId);

  const nextBlockTimestamp = useBlockchainStore.getState().nextBlockTimestamp;
  const { getOwnedEntityOnPosition } = useOwnedEntitiesOnPosition();

  const arrivalTime = getComponentValue(setup.components.ArrivalTime, getEntityIdFromKeys([entityId]));

  const depositEntityId = getOwnedEntityOnPosition(entityId);

  const entityState = determineEntityState(
    nextBlockTimestamp,
    false,
    Number(arrivalTime?.arrives_at || 0n),
    inventoryResources.length > 0,
  );

  const onOffload = async (receiverEntityId: bigint) => {
    setIsLoading(true);
    if (entityId && inventoryResources.length > 0) {
      await setup.systemCalls
        .send_resources({
          sender_entity_id: entityId,
          recipient_entity_id: receiverEntityId,
          resources: inventoryResources.flatMap((resource) => [resource.resourceId, resource.amount]),
          signer: account.account,
        })
        .finally(() => setIsLoading(false));
    }
  };

  return (
    depositEntityId !== undefined &&
    inventoryResources.length > 0 && (
      <div className="w-full">
        <Button
          size="md"
          className="w-full"
          isLoading={isLoading}
          disabled={entityState === EntityState.Traveling || battleInProgress}
          onClick={() => onOffload(depositEntityId)}
          variant="primary"
          withoutSound
        >
          {battleInProgress ? `Battle in progress` : `Deposit Resources`}
        </Button>
      </div>
    )
  );
};
