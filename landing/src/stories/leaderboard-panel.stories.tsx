import { LeaderboardPanel } from "@/components/modules/leaderboard-panel";
import type { Meta, StoryObj } from "@storybook/react";
import "../index.css";

const meta = {
  title: "Modules/LeaderboardPanel",
  component: LeaderboardPanel,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
    },
  },
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center min-h-screen text-gold">
        <div className="w-full">
          <Story />
        </div>
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof LeaderboardPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    players: [
      { name: "Player 1", points: 1000000000, percentage: 20, lords: 500, realms: 10, mines: 5, hyperstructures: 2 },
      { name: "Player 2", points: 950000000, percentage: 19, lords: 475, realms: 9, mines: 4, hyperstructures: 2 },
      { name: "Player 3", points: 900000000, percentage: 18, lords: 450, realms: 8, mines: 4, hyperstructures: 1 },
      { name: "Player 4", points: 850000000, percentage: 17, lords: 425, realms: 8, mines: 3, hyperstructures: 1 },
      { name: "Player 5", points: 800000000, percentage: 16, lords: 400, realms: 7, mines: 3, hyperstructures: 1 },
      { name: "Player 6", points: 750000000, percentage: 15, lords: 375, realms: 7, mines: 2, hyperstructures: 1 },
      { name: "Player 7", points: 700000000, percentage: 14, lords: 350, realms: 6, mines: 2, hyperstructures: 1 },
      { name: "Player 8", points: 650000000, percentage: 13, lords: 325, realms: 6, mines: 2, hyperstructures: 0 },
      { name: "Player 9", points: 600000000, percentage: 12, lords: 300, realms: 5, mines: 2, hyperstructures: 0 },
      { name: "Player 10", points: 550000000, percentage: 11, lords: 275, realms: 5, mines: 1, hyperstructures: 0 },
      { name: "Player 11", points: 500000000, percentage: 10, lords: 250, realms: 4, mines: 1, hyperstructures: 0 },
      { name: "Player 12", points: 450000000, percentage: 9, lords: 225, realms: 4, mines: 1, hyperstructures: 0 },
      { name: "Player 13", points: 400000000, percentage: 8, lords: 200, realms: 3, mines: 1, hyperstructures: 0 },
      { name: "Player 14", points: 350000000, percentage: 7, lords: 175, realms: 3, mines: 0, hyperstructures: 0 },
      { name: "Player 15", points: 300000000, percentage: 6, lords: 150, realms: 2, mines: 0, hyperstructures: 0 },
      { name: "Player 16", points: 250000000, percentage: 5, lords: 125, realms: 2, mines: 0, hyperstructures: 0 },
      { name: "Player 17", points: 200000000, percentage: 4, lords: 100, realms: 1, mines: 0, hyperstructures: 0 },
      { name: "Player 18", points: 150000000, percentage: 3, lords: 75, realms: 1, mines: 0, hyperstructures: 0 },
      { name: "Player 19", points: 100000000, percentage: 2, lords: 50, realms: 1, mines: 0, hyperstructures: 0 },
      { name: "Player 20", points: 50000000, percentage: 1, lords: 25, realms: 0, mines: 0, hyperstructures: 0 },
    ],
  },
};
