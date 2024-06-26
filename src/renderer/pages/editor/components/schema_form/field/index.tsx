import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  Stack,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import Grid from '@mui/material/Unstable_Grid2';
import { cloneDeep, get } from 'lodash';
import path from 'path';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RawJson } from '../../../../../../type';
import { UUID } from '../../../../../../utils/uuid';
import {
  processValueWithSchema,
  SchemaField,
  SchemaFieldArray,
  SchemaFieldBoolean,
  SchemaFieldFile,
  SchemaFieldNumber,
  SchemaFieldObject,
  SchemaFieldSelect,
  SchemaFieldString,
  SchemaFieldStringSpeed,
} from '../../../../../models/schema';
import { getProjectService } from '../../../../../services';
import { Translation } from '../../../../../store/common/translation';
import { animation, borderRadius } from '../../../../../theme';
import useLayout from '../../../patterns/story/use_layout';
import FieldBoolean from './boolean_field';
import FieldFile from './file_field';
import FieldNumber from './number_field';
import FieldSelect from './select_field';
import FieldString from './string_field';
import FieldStringSpeed from './string_speed_field';

const getContainerLabelStyle = (label: string) => ({
  m: 1,
  p: 3,
  pt: 6,
  border: `1px solid ${grey[400]}`,
  ...borderRadius.normal,
  position: 'relative',
  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px',
  '&:before': {
    position: 'absolute',
    left: '12px',
    top: '12px',
    color: grey[500],
    content: `"${label}"`,
    width: '-webkit-fill-available',
    zIndex: 'auto',
    background: 'inherit',
    overflow: 'hidden',
  },
});

export function FieldObject({
  schema,
  rootValue,
  value,
  onValueChange,
  translations,
  onTranslationsChange,
  currentLang,
  label,
}: {
  schema: SchemaFieldObject;
  rootValue: any;
  value: any;
  translations?: Translation;
  currentLang?: string;
  onValueChange?: (value: any) => void;
  onTranslationsChange?: (termKey: string, val: any) => void;
  label?: string;
}) {
  const valueRef = useRef(value);
  valueRef.current = value;
  const gridStyle = label ? getContainerLabelStyle(label) : {};
  const onObjectValueChange = useCallback(
    (fieldKey: string, v: any) => {
      if (onValueChange) {
        const res = {
          ...valueRef.current,
          [fieldKey]: v,
        };
        onValueChange(res);
      }
    },
    [onValueChange, schema, value]
  );

  const displayFields = useMemo(() => {
    return schema.fields.filter((field) => {
      if (field.data.config.enableWhen) {
        const fn = eval(field.data.config.enableWhen);
        if (!fn(value)) {
          return false;
        }
      }
      return true;
    });
  }, [schema.fields, rootValue, value]);

  return (
    <Grid
      xs={schema.config.colSpan}
      sx={{
        ...gridStyle,
        width: '-webkit-fill-available',
        background: '#fff',
      }}
    >
      <Grid
        container
        spacing={2}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {displayFields.map((field) => {
          return (
            <Field
              key={field.data.config.fieldId}
              schema={field.data}
              value={get(value, field.id)}
              onValueChange={(v) => onObjectValueChange(field.id, v)}
              onTranslationsChange={onTranslationsChange}
              rootValue={rootValue}
              label={field.name}
              translations={translations}
              currentLang={currentLang}
            />
          );
        })}
      </Grid>
    </Grid>
  );
}

export default function Field({
  schema,
  rootValue,
  value,
  onValueChange,
  translations,
  currentLang,
  onTranslationsChange,
  label,
}: {
  schema: SchemaField;
  rootValue: any;
  value: any;
  translations?: Translation;
  currentLang?: string;
  onValueChange?: (value: any) => void;
  onTranslationsChange?: (termKey: string, val: any) => void;
  label?: string;
}) {
  if (schema instanceof SchemaFieldObject) {
    return (
      <FieldObject
        schema={schema}
        value={value}
        rootValue={rootValue}
        onValueChange={onValueChange}
        translations={translations}
        currentLang={currentLang}
        onTranslationsChange={onTranslationsChange}
        label={label}
      />
    );
  }
  if (schema instanceof SchemaFieldArray) {
    return (
      <FieldArray
        schema={schema}
        value={value}
        onValueChange={onValueChange}
        translations={translations}
        currentLang={currentLang}
        onTranslationsChange={onTranslationsChange}
        label={label}
      />
    );
  }

  let componentContent = <></>;
  if (schema instanceof SchemaFieldString) {
    componentContent = (
      <FieldString
        schema={schema}
        value={value}
        onValueChange={onValueChange}
        onTranslationsChange={onTranslationsChange}
        translations={translations}
        currentLang={currentLang}
        label={label}
      />
    );
  }
  if (schema instanceof SchemaFieldBoolean) {
    componentContent = (
      <FieldBoolean
        schema={schema}
        value={value}
        onValueChange={onValueChange}
        label={label}
      />
    );
  }
  if (schema instanceof SchemaFieldNumber) {
    componentContent = (
      <FieldNumber
        schema={schema}
        value={value}
        onValueChange={onValueChange}
        label={label}
      />
    );
  }
  if (schema instanceof SchemaFieldFile) {
    componentContent = (
      <FieldFile
        schema={schema}
        value={value}
        onValueChange={onValueChange}
        label={label}
      />
    );
  }
  if (schema instanceof SchemaFieldSelect) {
    componentContent = (
      <FieldSelect
        schema={schema}
        value={value}
        onValueChange={onValueChange}
        label={label}
      />
    );
  }
  if (schema instanceof SchemaFieldStringSpeed) {
    componentContent = (
      <FieldStringSpeed
        schema={schema}
        value={value}
        currentLang={currentLang || ''}
        targetString={
          translations?.[get(rootValue, schema.config.targetProp)]?.[
            currentLang || ''
          ] || ''
        }
        onValueChange={onValueChange}
      />
    );
  }

  return <Grid xs={schema.config.colSpan}>{componentContent}</Grid>;
}

export function FieldArray({
  label,
  schema,
  value,
  translations,
  currentLang,
  onValueChange,
  onTranslationsChange,
}: {
  label?: string;
  schema: SchemaFieldArray;
  value: any[];
  translations?: Translation;
  currentLang?: string;
  onValueChange?: (value: any) => void;
  onTranslationsChange?: (termKey: string, val: any) => void;
}) {
  const [list, setList] = useState<RawJson[]>(
    (value || []).map((item) => {
      return {
        id: UUID(),
        expanded: false,
        value: item,
      };
    })
  );
  const listRef = useRef(list);
  listRef.current = list;
  const valueRef = useRef(value);
  valueRef.current = value;
  const hasInitRef = useRef(false);

  useEffect(() => {
    setList(
      (valueRef.current || []).map((item) => {
        return {
          id: UUID(),
          expanded: schema.config.initialExpand || false,
          value: item,
        };
      })
    );
  }, [schema]);

  useLayoutEffect(() => {
    if (value && !hasInitRef.current) {
      hasInitRef.current = true;
      setList(
        (value || []).map((item) => {
          return {
            id: UUID(),
            expanded: schema.config.initialExpand || false,
            value: item,
          };
        })
      );
    }
  }, [value]);

  const addItem = useCallback(() => {
    const prev = listRef.current;
    const res = prev.concat({
      id: UUID(),
      value: schema.fieldSchema.config.needI18n
        ? UUID()
        : schema.fieldSchema instanceof SchemaFieldObject
        ? schema.fieldSchema.configDefaultValue
        : schema.fieldSchema.config.defaultValue,
    });
    setList(res);
    if (onValueChange) {
      onValueChange(res.map((item) => item.value));
    }
  }, [onValueChange]);

  const moveUpItem = useCallback(
    (sourceIndex: number) => {
      const prev = listRef.current;
      const targetIndex = Math.max(sourceIndex - 1, 0);
      const res = prev.map((item, j) => {
        if (j === sourceIndex) {
          return prev[targetIndex];
        }
        if (j === targetIndex) {
          return prev[sourceIndex];
        }
        return item;
      }, []);
      setList(res);
      if (onValueChange) {
        onValueChange(res.map((item) => item.value));
      }
    },
    [onValueChange]
  );
  const moveDownItem = useCallback(
    (sourceIndex: number) => {
      const prev = listRef.current;
      const targetIndex = Math.min(sourceIndex + 1, prev.length - 1);
      const res = prev.map((item, j) => {
        if (j === sourceIndex) {
          return prev[targetIndex];
        }
        if (j === targetIndex) {
          return prev[sourceIndex];
        }
        return item;
      }, []);
      setList(res);
      if (onValueChange) {
        onValueChange(res.map((item) => item.value));
      }
    },
    [onValueChange]
  );
  const deleteItem = useCallback(
    (i: number) => {
      const prev = listRef.current;
      const res = prev.filter((_, j) => j !== i);
      setList(res);
      if (onValueChange) {
        onValueChange(res.map((item) => item.value));
      }
    },
    [onValueChange]
  );
  const duplicateItem = useCallback(
    (i: number) => {
      const targetItem = listRef.current[i].value;
      const newVal = processValueWithSchema(
        schema.fieldSchema,
        targetItem,
        (schema, val) => {
          if (schema instanceof SchemaFieldString && schema.config.needI18n) {
            const newContentId = 'string_field_' + UUID();
            if (translations && onTranslationsChange && currentLang) {
              onTranslationsChange(
                newContentId,
                translations[val]?.[currentLang]
              );
            }
            return newContentId;
          }
          return val;
        }
      );
      const prev = listRef.current;
      const res = [...prev];
      res.splice(i + 1, 0, {
        id: UUID(),
        expanded: false,
        value: newVal,
      });
      setList(res);
      if (onValueChange) {
        onValueChange(res.map((item) => item.value));
      }
    },
    [onValueChange, currentLang]
  );

  const onItemChange = useCallback(
    (v: any, i: number) => {
      const prev = listRef.current;
      const res = prev.map((item, j) =>
        j === i ? { ...item, value: v } : item
      );
      setList(res);
      if (onValueChange) {
        onValueChange(res.map((item) => item.value));
      }
    },
    [onValueChange]
  );

  const gridStyle = label ? getContainerLabelStyle(label) : {};
  return (
    <Grid
      sx={{
        display: 'flex',
        flexGrow: label ? 0 : 1,
        flexDirection: 'column',
        overflow: 'auto',
      }}
      xs={schema.config.colSpan}
    >
      <Stack
        spacing={2}
        sx={{
          height: '100%',
          ...gridStyle,
          p: label ? 4 : 0,
        }}
      >
        <Stack
          spacing={2}
          sx={{
            flexGrow: 1,
            // maxHeight: label ? schema.config.height || '300px' : 'inherit',
            pt: label ? 3 : 0,
          }}
        >
          {list.map((item, i) => {
            const summary = schema.fieldSchema?.config?.summary?.replace(
              /\{\{[A-Za-z0-9_.\[\]]+\}\}/g,
              (all) => {
                const word = all.substring(2, all.length - 2);
                if (word === '___key') {
                  return label;
                }
                if (word === '___index') {
                  return `<span style="font-weight: bold; margin: 0 4px">#${
                    i + 1
                  }</span>`;
                }
                if (word === '___value') {
                  return `<span style="font-weight: bold; margin: 0 4px">${item.value}</span>`;
                }
                if (word === '___newline') {
                  return `<br />`;
                }
                const v = get(item.value, word, '');
                if (v != null && v.includes && v.includes('.png')) {
                  const projectPath = getProjectService().projectPath.value;
                  const fullFilePath: any = projectPath
                    ? path.join(path.join(projectPath, 'resources'), v)
                    : null;

                  return `<div style="display: flex; justify-content: center; align-items: center; width: 80px; height: 80px; border-radius: 12px; background: ${grey[800]}; margin-left: 4px; margin-right: 4px;"><img style="width: 64px; height: 64px; object-fit: cover;" src="${fullFilePath}" alt="" /> </div>`;
                }
                if (
                  v &&
                  translations &&
                  currentLang &&
                  typeof v === 'string' &&
                  v in translations
                ) {
                  return `<span style="font-weight: bold; margin: 0 4px">${translations[v]?.[currentLang]}</span>`;
                }
                return `<span style="font-weight: bold; margin: 0 4px">${v}</span>`;
              }
            );
            return (
              <Card
                key={item.id}
                sx={{
                  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px',
                }}
              >
                <CardHeader
                  subheader={
                    <Stack
                      direction='row'
                      sx={{
                        alignItems: 'center',
                        fontWeight: 'bold',
                        userSelect: 'none',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: `<div>${summary}</div>`,
                      }}
                    />
                  }
                  action={
                    <Stack
                      direction='row'
                      sx={{
                        alignItems: 'center',
                      }}
                    >
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          moveUpItem(i);
                        }}
                      >
                        <ArrowUpwardIcon />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          moveDownItem(i);
                        }}
                      >
                        <ArrowDownwardIcon />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(i);
                        }}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateItem(i);
                        }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Stack>
                  }
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: grey[100],
                      ...animation.autoFade,
                    },
                  }}
                  onClick={() => {
                    setList((prev) => {
                      return prev.map((item, j) =>
                        j === i ? { ...item, expanded: !item.expanded } : item
                      );
                    });
                  }}
                />
                <Collapse in={item.expanded} timeout='auto'>
                  {item.expanded && (
                    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                      <Field
                        translations={translations}
                        currentLang={currentLang}
                        schema={schema.fieldSchema as SchemaField}
                        value={item.value}
                        rootValue={value}
                        onValueChange={(v) => onItemChange(v, i)}
                        onTranslationsChange={onTranslationsChange}
                      />
                    </CardContent>
                  )}
                </Collapse>
              </Card>
            );
          })}
        </Stack>
        <Button
          variant='contained'
          sx={{
            marginTop: 'auto',
          }}
          onClick={addItem}
        >
          Add Item
        </Button>
      </Stack>
    </Grid>
  );
}
