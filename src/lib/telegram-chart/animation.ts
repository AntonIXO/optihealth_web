export function quadInOut(t: number) {
    return ((t *= 2) <= 1 ? t * t : --t * (2 - t) + 1) / 2;
}

export function cubicOut(t: number) {
  return --t * t * t + 1;
}

export function quadOut(t: number) {
  return -t * (t - 2);
}

/**
 * A passive animation for an animation group
 */
export interface Animation {
  getState: () => any;
  isFinished: () => boolean;
  setTarget: (target: any, instant?: boolean) => void;
}

/**
 * Allows to have multiple animations with a single callback call on every animation frame
 */
export function makeAnimationGroup(animations: Record<string, Animation>, onUpdate: () => void) {
  let animationFrameId: number | null = null;
  const animationGroup = makeTransitionGroup(animations);

  function setTargets(targets: Record<string, any>) {
    animationGroup.setTarget(targets);
    if (!animationGroup.isFinished()) {
      updateOnNextFrame();
    }
  }

  function getState() {
    return animationGroup.getState();
  }

  function destroy() {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function updateOnNextFrame() {
    if (animationFrameId === null) {
      animationFrameId = window.requestAnimationFrame(handleAnimationFrame);
    }
  }

  function handleAnimationFrame() {
    animationFrameId = null;

    if (!animationGroup.isFinished()) {
      updateOnNextFrame();
    }

    onUpdate();
  }

  return {setTargets, getState, destroy, updateOnNextFrame};
}

export function makeTransition(initialValue = 0, {
  duration = 400,
  easing = quadInOut,
  maxDistance = Infinity
} = {}): Animation {
  let startValue = initialValue;
  let startTime = Date.now();
  let targetValue = initialValue;
  let finished = true;

  function getState() {
    const stage = Math.min(1, (Date.now() - startTime) / duration);

    if (stage >= 1) {
      finished = true;
    }

    return startValue + (targetValue - startValue) * easing(stage);
  }

  function isFinished() {
    return finished;
  }

  function setTarget(value: number, instant?: boolean) {
    if (value === targetValue) {
      return;
    }

    startValue = instant ? value : getState();
    startTime = Date.now();
    targetValue = value;
    finished = false;

    if (startValue < targetValue) {
      startValue = Math.max(startValue, targetValue - maxDistance);
    } else {
      startValue = Math.min(startValue, targetValue + maxDistance);
    }
  }

  return {getState, isFinished, setTarget};
}

export function makeTransitionGroup(transitions: Record<string, Animation>): Animation {
  const transitionKeys = Object.keys(transitions);

  return {
    getState() {
      const state: any = {};

      for (let i = 0; i < transitionKeys.length; ++i) {
        state[transitionKeys[i]] = transitions[transitionKeys[i]].getState();
      }

      return state;
    },
    isFinished() {
      for (let i = 0; i < transitionKeys.length; ++i) {
        if (!transitions[transitionKeys[i]].isFinished()) {
          return false;
        }
      }

      return true;
    },
    setTarget(targets: any, instant?: boolean) {
      if (!targets) {
        return;
      }

      for (const key in targets) {
        if (transitions.hasOwnProperty(key)) {
          transitions[key].setTarget(targets[key], instant);
        }
      }
    }
  };
}

export function makeInstantWhenHiddenTransition(valueTransition: Animation, opacityTransition: Animation): Animation {
  return {
    getState() {
      return [valueTransition.getState(), opacityTransition.getState()];
    },
    isFinished() {
      return valueTransition.isFinished() && opacityTransition.isFinished();
    },
    setTarget([value, opacity]: [any, any], instant?: boolean) {
      if (value !== undefined) {
        valueTransition.setTarget(value, instant || opacityTransition.getState() <= 0);
      }
      opacityTransition.setTarget(opacity, instant);
    }
  };
}

export function makeExponentialTransition(initialValue = 0, {minPowerValue = 1e-9, ...options} = {}): Animation {
  function plainValueToPower(value: number) {
    return Math.max(Math.log(value), minPowerValue);
  }

  function powerToPlainValue(power: number) {
    return Math.exp(power);
  }

  const powerTransition = makeTransition(plainValueToPower(initialValue), options);

  return {
    getState() {
      return powerToPlainValue(powerTransition.getState());
    },
    isFinished: powerTransition.isFinished,
    setTarget(value: number, instant?: boolean) {
      powerTransition.setTarget(plainValueToPower(value), instant);
    }
  };
}

export function makeLogarithmicTransition(initialValue = 0, {minValue = 1e-9, ...options} = {}): Animation {
  function plainValueToPower(value: number) {
    return Math.max(Math.log(value), minValue);
  }

  function powerToPlainValue(power: number) {
    return Math.exp(power);
  }

  const valueTransition = makeTransition(powerToPlainValue(initialValue), options);

  return {
    getState() {
      return plainValueToPower(valueTransition.getState());
    },
    isFinished: valueTransition.isFinished,
    setTarget(value: number, instant?: boolean) {
      valueTransition.setTarget(powerToPlainValue(value), instant);
    }
  };
}
