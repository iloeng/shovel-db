import { useState, useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '../project';
import { LANG } from '../../../constants/i18n';

interface Translation {
  [key: string]: {
    [key: string]: string;
  };
}

export default function useTranslation() {
  const { projectSettings } = useProjectStore();
  const [currentLang, setCurrentLang] = useState<LANG>(projectSettings.i18n[0]);
  const [translations, setTranslations] = useState<Translation>({});
  const translationsRef = useRef(translations);
  translationsRef.current = translations;

  useEffect(() => {
    setCurrentLang((prev) => {
      if (!projectSettings.i18n.includes(prev)) {
        return projectSettings.i18n[0];
      }
      return prev;
    });
  }, [projectSettings.i18n]);

  const tr = useCallback(
    (key: string) => {
      return translations[key]?.[currentLang] !== undefined
        ? translations[key]?.[currentLang]
        : key;
    },
    [currentLang, translations]
  );

  const updateTranslations = useCallback((val: Translation) => {
    setTranslations(val);
    translationsRef.current = val;
  }, []);

  const updateTranslateKey = useCallback(
    (key: string, val: string) => {
      const newTranslations = { ...translationsRef.current };
      newTranslations[key] = {
        ...newTranslations[key],
        [currentLang]: val,
      };
      projectSettings.i18n.forEach((lang) => {
        if (lang !== currentLang) {
          newTranslations[key][lang] = newTranslations[key][lang] || '';
        }
      });
      setTranslations(newTranslations);
      translationsRef.current = newTranslations;
    },
    [currentLang, projectSettings.i18n]
  );

  const updateTranslateKeyAll = useCallback(
    (key: string, val: any) => {
      const newTranslations = { ...translationsRef.current };
      newTranslations[key] = {
        ...newTranslations[key],
      };
      projectSettings.i18n.forEach((lang) => {
        newTranslations[key][lang] =
          val?.[lang] || newTranslations[key]?.[lang] || '';
      });
      setTranslations(newTranslations);
      translationsRef.current = newTranslations;
    },
    [projectSettings.i18n]
  );

  const hasTranslateKey = useCallback((key: string) => {
    return key in translationsRef.current;
  }, []);

  const getTranslationsForKey = useCallback(
    (key: string) => {
      return translations[key];
    },
    [translations]
  );

  return {
    currentLang,
    translations,
    getTranslationsForKey,
    hasTranslateKey,
    tr,
    updateTranslations,
    updateTranslateKey,
    updateTranslateKeyAll,
  };
}
