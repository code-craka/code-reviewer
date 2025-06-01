"use client";

import { useEffect, useCallback, useRef, useReducer } from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: string;
    };

interface State {
  toasts: ToasterToast[];
}

function toastReducer(state: State, action: Action): State {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId
              ? {
                  ...t,
                  open: false,
                }
              : t,
          ),
        };
      }

      return {
        ...state,
        toasts: state.toasts.map((t) => ({
          ...t,
          open: false,
        })),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
}

function useToast() {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const listeners = useRef<Map<string, (open: boolean) => void>>(new Map());

  const toast = useCallback(({ ...props }: Omit<ToasterToast, "id">) => {
    const id = generateId();

    const update = (props: ToasterToast) =>
      dispatch({
        type: actionTypes.UPDATE_TOAST,
        toast: { ...props, id },
      } as Action);
    const dismiss = () =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id } as Action);

    dispatch({
      type: actionTypes.ADD_TOAST,
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) dismiss();
        },
      } as ToasterToast,
    });

    return {
      id,
      dismiss,
      update,
    };
  }, []);

  const dismissAll = useCallback(() => {
    dispatch({ type: actionTypes.DISMISS_TOAST } as Action);
  }, []);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    state.toasts.forEach((toast) => {
      if (toast.open === false) {
        timeouts.push(
          setTimeout(() => {
            dispatch({
              type: actionTypes.REMOVE_TOAST,
              toastId: toast.id,
            } as Action);
          }, TOAST_REMOVE_DELAY),
        );
      }
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [state.toasts]);

  return {
    ...state,
    toast,
    dismissAll,
    listeners,
  };
}

export { useToast, type ToasterToast };
