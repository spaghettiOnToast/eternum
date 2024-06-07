import { useState, useMemo } from "react";
import { useDojo } from "../../../../hooks/context/DojoContext";
import Button from "../../../elements/Button";
import TextInput from "@/ui/elements/TextInput";
import { SelectBox } from "@/ui/elements/SelectBox";
import { Tabs } from "../../../elements/tab";
import { MAX_NAME_LENGTH } from "@bibliothecadao/eternum";

import { useGuilds } from "../../../../hooks/helpers/useGuilds";
import { hasGuild } from "./utils";
import { GuildMembers } from "./GuildMembers";
import { Whitelist } from "./Whitelist";

export const MyGuild = () => {
  const {
    setup: {
      systemCalls: { create_guild, leave_guild, transfer_guild_ownership },
    },
    network: { provider },
    account: { account },
  } = useDojo();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [playerAddress, setPlayerAddress] = useState("");
  const [isTransferingOwnership, setIsTransferingOwnership] = useState(false);

  const [isCreatingGuild, setIsCreatingGuild] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [newGuildName, setNewGuildName] = useState("");

  const { getAddressGuild, getGuildMembers } = useGuilds();

  const { userGuildEntityId, isOwner, guildName } = getAddressGuild(account.address);
  const { guildMembers } = getGuildMembers(userGuildEntityId!);

  const [editName, setEditName] = useState(false);
  const [naming, setNaming] = useState("");

  const tabs = useMemo(
    () => [
      {
        key: "GuildMembers",
        label: (
          <div className="flex group relative flex-col items-center">
            <div>Guild Members</div>
          </div>
        ),
        component: <GuildMembers guildMembers={guildMembers} isOwner={isOwner} />,
      },
      {
        key: "Whitelist",
        label: (
          <div className="flex group relative flex-col items-center">
            <div>Whitelist</div>
          </div>
        ),
        component: <Whitelist guildEntityId={userGuildEntityId} isOwner={isOwner} />,
      },
    ],
    [selectedTab],
  );

  const createGuild = () => {
    setIsLoading(true);
    setIsCreatingGuild(false);
    create_guild({
      is_public: isPublic,
      guild_name: newGuildName,
      signer: account,
    }).finally(() => setIsLoading(false));
  };

  const leaveGuild = () => {
    setIsLoading(true);
    leave_guild({ signer: account }).finally(() => setIsLoading(false));
  };

  const transferGuildOwnership = () => {
    setIsLoading(true);
    transfer_guild_ownership({
      guild_entity_id: userGuildEntityId!,
      to_player_address: playerAddress,
      signer: account,
    }).finally(() => setIsLoading(false));
  };

  return (
    <div className="flex flex-col">
      {hasGuild(userGuildEntityId) ? (
        <>
          <div className="relative flex flex-row justify-center">
            {editName ? (
              <div className="flex space-x-2 items-baseline mr-20">
                <TextInput
                  placeholder="Type Name"
                  className="h-full ml-10 mx-5"
                  value={naming}
                  onChange={(name) => setNaming(name)}
                  maxLength={MAX_NAME_LENGTH}
                />
                <Button
                  variant="default"
                  size="xs"
                  isLoading={isLoading}
                  disabled={naming == ""}
                  onClick={async () => {
                    setIsLoading(true);

                    try {
                      await provider.set_entity_name({
                        signer: account,
                        entity_id: userGuildEntityId!,
                        name: naming,
                      });
                    } catch (e) {
                      console.error(e);
                    }

                    setIsLoading(false);
                    setEditName(false);
                  }}
                >
                  Change Name
                </Button>
              </div>
            ) : (
              <p className="py-2">{guildName}</p>
            )}

            {isOwner && (
              <div className="absolute right-0 pr-5 flex h-full items-center">
                <Button size="xs" variant="default" onClick={() => setEditName(!editName)}>
                  edit name
                </Button>
              </div>
            )}
          </div>

          <Tabs
            selectedIndex={selectedTab}
            onChange={(index: number) => setSelectedTab(index)}
            variant="default"
            className="h-full"
          >
            <Tabs.List>
              {tabs.map((tab, index) => (
                <Tabs.Tab key={index}>{tab.label}</Tabs.Tab>
              ))}
            </Tabs.List>
            <Tabs.Panels className="overflow-hidden">
              {tabs.map((tab, index) => (
                <Tabs.Panel key={index}>{tab.component}</Tabs.Panel>
              ))}
            </Tabs.Panels>
          </Tabs>

          <div className="flex justify-end">
            <div className="px-4 my-3">
              {isOwner ? (
                <div className="flex justify-end px-3 items-baseline">
                  {isTransferingOwnership && (
                    <>
                      <TextInput
                        placeholder="Player address"
                        className="border border-gold  !w-1/2 !flex-grow-0 !text-light-pink text-xs mx-5"
                        value={playerAddress}
                        onChange={(playerAddress) => setPlayerAddress(playerAddress)}
                      />
                      <Button size="xs" onClick={transferGuildOwnership} disabled={playerAddress == ""}>
                        Confirm
                      </Button>
                    </>
                  )}

                  {guildMembers.length > 1 ? (
                    <Button
                      className="ml-5"
                      isLoading={isLoading}
                      onClick={() => setIsTransferingOwnership(!isTransferingOwnership)}
                      size="xs"
                    >
                      Assign new leader
                    </Button>
                  ) : (
                    <Button isLoading={isLoading} onClick={leaveGuild} size="xs">
                      Disband Guild
                    </Button>
                  )}
                </div>
              ) : (
                <Button isLoading={isLoading} onClick={leaveGuild} size="xs">
                  Leave Guild
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex my-2 p-4 justify-center">
            <Button isLoading={isLoading} onClick={() => setIsCreatingGuild(!isCreatingGuild)}>
              Create Guild
            </Button>
          </div>

          {isCreatingGuild && (
            <div className="flex justify-between mx-3 mb-3 items-baseline">
              <SelectBox selected={isPublic} onClick={() => setIsPublic(!isPublic)}>
                <p className={`p-1 text-sm ${isPublic ? "text-dark" : "text-gold"}`}>Public</p>
              </SelectBox>
              Guild Name
              <TextInput
                className="border border-gold  !w-1/2 !flex-grow-0 !text-light-pink text-xs"
                value={newGuildName}
                onChange={(newGuildName) => setNewGuildName(newGuildName)}
                maxLength={MAX_NAME_LENGTH}
              />
              <Button onClick={createGuild} disabled={newGuildName == ""}>
                Confirm
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
