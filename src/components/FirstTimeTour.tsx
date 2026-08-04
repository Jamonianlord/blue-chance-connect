import { useEffect, useRef } from "react";

type DriverStep = {
  element: string;
  popover: {
    title: string;
    description: string;
    position: string;
  };
};

declare const Driver: {
  new (options: Record<string, unknown>): {
    defineSteps: (steps: DriverStep[]) => void;
    on: (event: string, callback: () => void) => void;
    start: () => void;
    destroy: () => void;
  };
};

declare const driver: new (options: Record<string, unknown>) => {
  defineSteps: (steps: DriverStep[]) => void;
  on: (event: string, callback: () => void) => void;
  start: () => void;
  destroy: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DriverModule = require("driver.js");

const TOUR_SEEN_KEY = "1chance_tour_seen";

export function FirstTimeTour() {
  const hasSeenTourRef = useRef(false);

  useEffect(() => {
    if (hasSeenTourRef.current) return;
    const hasSeenTour = localStorage.getItem(TOUR_SEEN_KEY);
    if (hasSeenTour) {
      hasSeenTourRef.current = true;
      return;
    }

    const steps: DriverStep[] = [
      {
        element: "#btn-find-match",
        popover: {
          title: "Find a match",
          description:
            "Tap here to instantly connect with someone new who's online right now.",
          position: "bottom",
        },
      },
      {
        element: '[href="/groups"]',
        popover: {
          title: "Groups",
          description:
            "Join interest-based group chats to meet people with similar hobbies and interests.",
          position: "bottom",
        },
      },
      {
        element: '[href="/chats"]',
        popover: {
          title: "Friends",
          description:
            "View and message all your accepted matches here — conversations continue until you both decide to end them.",
          position: "bottom",
        },
      },
      {
        element: "#btn-game-picker",
        popover: {
          title: "Mini-games",
          description:
            "Play icebreaker games like Tic Tac Toe with your match — tap the game icon anytime!",
          position: "top",
        },
      },
      {
        element: '[href="/profile"]',
        popover: {
          title: "Profile",
          description:
            "Edit your name, age, gender, interests, and avatar to control how others see you.",
          position: "bottom",
        },
      },
    ];

    const driverInstance = new DriverModule.default({
      animate: true,
      opacity: true,
      pauseOnNav: true,
      removeBtnAtEnd: true,
      showClassNames: false,
      viewPort: {
        side: "center",
        padding: 100,
      },
      options: {
        namePrefix: "1chance",
        elementClass: "1chance-driver",
      },
    });

    driverInstance.defineSteps(steps);

    driverInstance.on("complete", () => {
      localStorage.setItem(TOUR_SEEN_KEY, "true");
    });

    driverInstance.on("destroy", () => {
      hasSeenTourRef.current = true;
    });

    driverInstance.start();

    return () => {
      driverInstance.destroy();
    };
  }, []);

  return null;
}