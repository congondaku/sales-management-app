import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  // État et setters pour la valeur debouncée
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // Mettre à jour la valeur debouncée après le délai
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Annuler le timeout si value change (effet de nettoyage)
      // Cela garantit que la valeur debouncée ne change que si la
      // valeur d'entrée n'a pas changé pendant la période de délai
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Ne réexécuter l'effet que si value ou delay changent
  );

  return debouncedValue;
};

// Hook pour debouncer une fonction callback
export const useDebouncedCallback = (callback, delay, dependencies) => {
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedCallback = (...args) => {
    // Annuler le timer précédent
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Définir un nouveau timer
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  };

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Nettoyer et redéfinir si les dépendances changent
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, dependencies);

  return debouncedCallback;
};
