import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

type DriverPopover = {
  title?: string;
  description?: string;
  side?: "top" | "right" | "bottom" | "left";
};

type DriveStep = {
  element: string;
  popover: DriverPopover;
};

const TOUR_SEEN_KEY = "1chance_tour_seen";

export function FirstTimeTour() {
  const hasSeenTourRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasSeenTourRef.current) return;

    const hasSeenTour = localStorage.getItem(TOUR_SEEN_KEY);
    if (hasSeenTour) {
      hasSeenTourRef.current = true;
      return;
    }

    hasSeenTourRef.current = true;

    let cancelled = false;

    const steps: DriveStep[] = [
      {
        element: "#btn-find-match",
        popover: {
          title: "Find a match",
          description:
            "Tap here to instantly connect with someone new who's online right now.",
          side: "bottom",
        },
      },
      {
        element: '[href="/groups"]',
        popover: {
          title: "Groups",
          description:
            "Join interest-based group chats to meet people with similar hobbies and interests.",
          side: "bottom",
        },
      },
      {
        element: '[href="/chats"]',
        popover: {
          title: "Friends",
          description:
            "View and message all your accepted matches here — conversations continue until you both decide to end them.",
          side: "bottom",
        },
      },
      {
        element: "#btn-game-picker",
        popover: {
          title: "Mini-games",
          description:
            "Play icebreaker games like Tic Tac Toe with your match — tap the game icon anytime!",
          side: "top",
        },
      },
      {
        element: '[href="/profile"]',
        popover: {
          title: "Profile",
          description:
            "Edit your name, age, gender, interests, and avatar to control how others see you.",
          side: "bottom",
        },
      },
    ];

    const initTour = () => {
      if (cancelled) return;

      const driverObj = driver({
        animate: true,
        showProgress: true,
        steps: steps,
        allowClose: true,
        onDoneClick: () => {
          localStorage.setItem(TOUR_SEEN_KEY, "true");
        },
        onCloseClick: () => {
          localStorage.setItem(TOUR_SEEN_KEY, "true");
        },
      } as { animate: boolean; showProgress: boolean; steps: DriveStep[]; allowClose: boolean; onDoneClick: () => void; onCloseClick: () => void });

      driverObj.drive();
    };

    initTour();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}