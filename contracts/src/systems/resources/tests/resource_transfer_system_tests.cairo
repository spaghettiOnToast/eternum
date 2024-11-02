mod resource_transfer_system_tests {
    use core::num::traits::Bounded;

    use core::traits::Into;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use eternum::alias::ID;
    use eternum::constants::DONKEY_ENTITY_TYPE;

    use eternum::constants::ResourceTypes;
    use eternum::constants::WORLD_CONFIG_ID;
    use eternum::models::capacity::CapacityCategory;
    use eternum::models::config::WeightConfig;
    use eternum::models::config::{CapacityConfig, CapacityConfigCategory};
    use eternum::models::owner::{Owner, EntityOwner};
    use eternum::models::position::Position;
    use eternum::models::quantity::Quantity;
    use eternum::models::resources::{Resource, ResourceAllowance};

    use eternum::systems::config::contracts::{config_systems, IWeightConfigDispatcher, IWeightConfigDispatcherTrait};

    use eternum::systems::resources::contracts::resource_systems::{
        resource_systems, IResourceSystemsDispatcher, IResourceSystemsDispatcherTrait
    };

    use eternum::utils::testing::{world::spawn_eternum, systems::deploy_system, config::set_capacity_config};
    use starknet::contract_address_const;


    fn setup() -> (IWorldDispatcher, IResourceSystemsDispatcher) {
        let world = spawn_eternum();

        let config_systems_address = deploy_system(world, config_systems::TEST_CLASS_HASH);

        set_capacity_config(config_systems_address);

        // set weight configuration for stone
        IWeightConfigDispatcher { contract_address: config_systems_address }
            .set_weight_config(ResourceTypes::STONE.into(), 200);

        // set weight configuration for gold
        IWeightConfigDispatcher { contract_address: config_systems_address }
            .set_weight_config(ResourceTypes::WOOD.into(), 200);

        // set donkey config
        set!(world, (CapacityConfig { category: CapacityConfigCategory::Donkey, weight_gram: 1_000_000 }));

        let resource_systems_address = deploy_system(world, resource_systems::TEST_CLASS_HASH);

        let resource_systems_dispatcher = IResourceSystemsDispatcher { contract_address: resource_systems_address };

        (world, resource_systems_dispatcher)
    }


    fn make_owner_and_receiver(world: IWorldDispatcher, sender_entity_id: ID, receiver_entity_id: ID) {
        let sender_entity_position = Position { x: 100_000, y: 200_000, entity_id: sender_entity_id.into() };

        set!(world, (sender_entity_position));
        set!(
            world,
            (
                Owner { address: contract_address_const::<'owner_entity'>(), entity_id: sender_entity_id.into() },
                EntityOwner { entity_id: sender_entity_id.into(), entity_owner_id: sender_entity_id.into() },
                Resource { entity_id: sender_entity_id.into(), resource_type: ResourceTypes::STONE, balance: 1000 },
                Resource {
                    entity_id: sender_entity_id.into(), resource_type: ResourceTypes::DONKEY, balance: 1_000_000_000
                },
                CapacityCategory { entity_id: sender_entity_id.into(), category: CapacityConfigCategory::Structure },
                Resource { entity_id: sender_entity_id.into(), resource_type: ResourceTypes::WOOD, balance: 1000 }
            )
        );

        let receiver_entity_position = Position { x: 200_000, y: 100_000, entity_id: receiver_entity_id.into() };
        set!(world, (receiver_entity_position));
        set!(
            world,
            (
                CapacityCategory { entity_id: receiver_entity_id.into(), category: CapacityConfigCategory::Structure },
                Resource {
                    entity_id: receiver_entity_id.into(), resource_type: ResourceTypes::DONKEY, balance: 1_000_000_000
                },
            )
        );

        // call world.dispatcher.uuid() to ensure next id isn't 0
        world.dispatcher.uuid();
    }


    ////////////////////////////
    // Test transfer
    ////////////////////////////

    #[test]
    #[available_gas(30000000000000)]
    fn resources_test_transfer() {
        let (world, resource_systems_dispatcher) = setup();

        let sender_entity_id: ID = 11;
        let receiver_entity_id: ID = 12;
        make_owner_and_receiver(world, sender_entity_id, receiver_entity_id);

        // transfer resources
        starknet::testing::set_contract_address(contract_address_const::<'owner_entity'>());

        resource_systems_dispatcher
            .send(
                sender_entity_id.into(),
                receiver_entity_id.into(),
                array![(ResourceTypes::STONE, 400), (ResourceTypes::WOOD, 700),].span()
            );

        // verify sender's resource balances
        let sender_entity_resource_stone = get!(world, (sender_entity_id, ResourceTypes::STONE), Resource);
        let sender_entity_resource_wood = get!(world, (sender_entity_id, ResourceTypes::WOOD), Resource);
        assert(sender_entity_resource_stone.balance == 600, 'stone balance mismatch');
        assert(sender_entity_resource_wood.balance == 300, 'wood balance mismatch');
    }


    #[test]
    #[available_gas(30000000000000)]
    #[should_panic(
        expected: (
            "not enough resources, Resource (entity id: 11, resource type: DONKEY, balance: 1). deduction: 1000",
            'ENTRYPOINT_FAILED'
        )
    )]
    fn resources_test_transfer__not_enough_donkey() {
        let (world, resource_systems_dispatcher) = setup();

        let sender_entity_id = 11;
        let receiver_entity_id = 12;
        make_owner_and_receiver(world, sender_entity_id, receiver_entity_id);

        // set sender's donkey balance to 1
        set!(
            world, (Resource { entity_id: sender_entity_id.into(), resource_type: ResourceTypes::DONKEY, balance: 1 },)
        );

        // set receiving entity capacity, and weight config
        set!(
            world,
            (
                WeightConfig {
                    config_id: WORLD_CONFIG_ID,
                    weight_config_id: ResourceTypes::STONE.into(),
                    entity_type: ResourceTypes::STONE.into(),
                    weight_gram: 10
                },
                WeightConfig {
                    config_id: WORLD_CONFIG_ID,
                    weight_config_id: ResourceTypes::WOOD.into(),
                    entity_type: ResourceTypes::WOOD.into(),
                    weight_gram: 10
                },
                CapacityConfig { category: CapacityConfigCategory::Donkey, weight_gram: 11_000 }
            )
        );

        // transfer resources
        starknet::testing::set_contract_address(contract_address_const::<'owner_entity'>());

        // should fail because sender does not have enough donkey
        resource_systems_dispatcher
            .send(
                sender_entity_id.into(),
                receiver_entity_id.into(),
                array![(ResourceTypes::STONE, 400), (ResourceTypes::WOOD, 700),].span()
            );
    }


    #[test]
    #[available_gas(30000000000000)]
    #[should_panic(expected: ('Not Owner', 'ENTRYPOINT_FAILED'))]
    fn resources_test_transfer__not_owner() {
        let (_, resource_systems_dispatcher) = setup();

        // transfer resources
        starknet::testing::set_contract_address(contract_address_const::<'unknown'>());

        resource_systems_dispatcher.send(1, 2, array![(ResourceTypes::STONE, 400), (ResourceTypes::WOOD, 700),].span());
    }


    #[test]
    #[available_gas(30000000000000)]
    #[should_panic(
        expected: (
            "not enough resources, Resource (entity id: 11, resource type: STONE, balance: 1000). deduction: 7700",
            'ENTRYPOINT_FAILED'
        )
    )]
    fn resources_test_transfer__insufficient_balance() {
        let (world, resource_systems_dispatcher) = setup();

        let sender_entity_id = 11;
        let receiver_entity_id = 12;
        make_owner_and_receiver(world, sender_entity_id, receiver_entity_id);

        // transfer resources
        starknet::testing::set_contract_address(contract_address_const::<'owner_entity'>());

        resource_systems_dispatcher
            .send(
                sender_entity_id.into(),
                receiver_entity_id.into(),
                array![(ResourceTypes::STONE, 7700), // more than balance
                 (ResourceTypes::WOOD, 700),].span()
            );
    }


    ////////////////////////////
    // Test transfer_from
    ////////////////////////////

    #[test]
    #[available_gas(30000000000000)]
    fn resources_test_transfer_from() {
        let (world, resource_systems_dispatcher) = setup();

        let owner_entity_id = 11;
        let receiver_entity_id = 12;
        let approved_entity_id = receiver_entity_id;
        make_owner_and_receiver(world, owner_entity_id, receiver_entity_id);

        set!(
            world,
            (
                Owner { address: contract_address_const::<'approved_entity'>(), entity_id: approved_entity_id.into() },
                EntityOwner { entity_id: approved_entity_id.into(), entity_owner_id: approved_entity_id.into() }
            )
        );

        // owner approves approved
        starknet::testing::set_contract_address(contract_address_const::<'owner_entity'>());
        resource_systems_dispatcher
            .approve(
                owner_entity_id.into(),
                approved_entity_id.into(),
                array![(ResourceTypes::STONE, 600), (ResourceTypes::WOOD, 800),].span()
            );

        // approved entity transfers resources
        starknet::testing::set_contract_address(contract_address_const::<'approved_entity'>());

        resource_systems_dispatcher
            .pickup(
                receiver_entity_id.into(),
                owner_entity_id.into(),
                array![(ResourceTypes::STONE, 400), (ResourceTypes::WOOD, 700),].span()
            );

        // check approval balance
        let approved_entity_stone_allowance = get!(
            world, (owner_entity_id, approved_entity_id, ResourceTypes::STONE), ResourceAllowance
        );
        let approved_entity_wood_allowance = get!(
            world, (owner_entity_id, approved_entity_id, ResourceTypes::WOOD), ResourceAllowance
        );
        assert(approved_entity_stone_allowance.amount == 200, 'stone allowance mismatch');
        assert(approved_entity_wood_allowance.amount == 100, 'wood allowance mismatch');

        // verify sender's resource balances
        let owner_entity_resource_stone = get!(world, (owner_entity_id, ResourceTypes::STONE), Resource);
        let owner_entity_resource_wood = get!(world, (owner_entity_id, ResourceTypes::WOOD), Resource);
        assert(owner_entity_resource_stone.balance == 600, 'stone balance mismatch');
        assert(owner_entity_resource_wood.balance == 300, 'wood balance mismatch');
    }


    #[test]
    #[available_gas(30000000000000)]
    fn resources_test_transfer_from__with_infinite_approval() {
        let (world, resource_systems_dispatcher) = setup();

        let owner_entity_id = 11;
        let receiver_entity_id = 12;
        let approved_entity_id = receiver_entity_id;

        make_owner_and_receiver(world, owner_entity_id, receiver_entity_id);

        set!(
            world,
            (
                Owner { address: contract_address_const::<'approved_entity'>(), entity_id: approved_entity_id.into() },
                EntityOwner { entity_id: approved_entity_id.into(), entity_owner_id: approved_entity_id.into() }
            )
        );

        // owner approves approved
        starknet::testing::set_contract_address(contract_address_const::<'owner_entity'>());
        resource_systems_dispatcher
            .approve(
                owner_entity_id.into(),
                approved_entity_id.into(),
                array![(ResourceTypes::STONE, Bounded::MAX), (ResourceTypes::WOOD, Bounded::MAX),].span()
            );

        // approved entity transfers resources
        starknet::testing::set_contract_address(contract_address_const::<'approved_entity'>());

        resource_systems_dispatcher
            .pickup(
                receiver_entity_id.into(),
                owner_entity_id.into(),
                array![(ResourceTypes::STONE, 400), (ResourceTypes::WOOD, 700),].span()
            );

        // check approval balance
        let approved_entity_stone_allowance = get!(
            world, (owner_entity_id, approved_entity_id, ResourceTypes::STONE), ResourceAllowance
        );
        let approved_entity_wood_allowance = get!(
            world, (owner_entity_id, approved_entity_id, ResourceTypes::WOOD), ResourceAllowance
        );
        assert(approved_entity_stone_allowance.amount == Bounded::MAX, 'stone allowance mismatch');
        assert(approved_entity_wood_allowance.amount == Bounded::MAX, 'wood allowance mismatch');

        // verify owner's resource balances
        let owner_entity_resource_stone = get!(world, (owner_entity_id, ResourceTypes::STONE), Resource);
        let owner_entity_resource_wood = get!(world, (owner_entity_id, ResourceTypes::WOOD), Resource);
        assert(owner_entity_resource_stone.balance == 600, 'stone balance mismatch');
        assert(owner_entity_resource_wood.balance == 300, 'wood balance mismatch');
    }
}
