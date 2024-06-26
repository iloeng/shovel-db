import React, { useEffect, useMemo, useState } from 'react';
import {
  Stack,
  Select,
  MenuItem,
  FormLabel,
  Box,
  InputLabel,
  FormControl,
  IconButton,
} from '@mui/material';
import { SchemaFieldSelect } from '../../../../../models/schema';
import { get } from 'lodash';
import {
  useStaticDataStore,
  useStoryStore,
  useFileStore,
} from '../../../../../stores';
import { Clear } from '@mui/icons-material';

function FieldSelect({
  label,
  schema,
  value,
  onValueChange,
}: {
  label?: string;
  schema: SchemaFieldSelect;
  value: any;
  onValueChange?: (value: any) => void;
}) {
  const isGrouping = schema.config.options.find((item: any) => !!item.children);

  const storyStore = useStoryStore();
  const staticDataStore = useStaticDataStore();
  const fileStore = useFileStore();
  const [options, setOptions] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      if (schema.config.dynamicOptions) {
        const fn = eval(schema.config.dynamicOptions);
        const res = await fn({ storyStore, staticDataStore, fileStore });
        setOptions(res || []);
        return;
      }
      setOptions(schema.config?.options || []);
    };
    fetchOptions();
  }, [schema, storyStore, staticDataStore, fileStore]);

  if (!options) {
    return null;
  }

  const childOptions =
    options.find(
      (item: any) =>
        item.value ===
        get(value, get(schema.config, 'groupConfig.group.valueKey'))
    )?.children || [];

  return (
    <Stack
      direction='row'
      sx={{ width: '100%', alignItems: 'center' }}
      spacing={1}
    >
      <FormControl sx={{ flexGrow: 1 }}>
        <InputLabel id={schema.config.fieldId}>
          {isGrouping ? schema.config.groupConfig?.group?.label : label}
        </InputLabel>
        <Select
          labelId={schema.config.fieldId}
          label={isGrouping ? schema.config.groupConfig?.group?.label : label}
          size='small'
          value={
            isGrouping
              ? get(value, get(schema.config, 'groupConfig.group.valueKey')) ||
                ''
              : value || ''
          }
          onChange={(e) => {
            if (onValueChange && !isGrouping) {
              onValueChange(e.target.value);
            } else if (onValueChange) {
              onValueChange({
                [schema.config.groupConfig?.group?.valueKey]: e.target.value,
                [schema.config.groupConfig?.group?.childKey]: options.find(
                  (item: any) =>
                    item.value ===
                    get(
                      e.target.value,
                      get(schema.config, 'groupConfig.group.valueKey')
                    )
                )?.children?.[0]?.value,
              });
            }
          }}
          sx={{
            width: '100%',
          }}
          inputProps={{
            tabIndex: -1,
          }}
          tabIndex={-1}
        >
          {options.map((item: any) => {
            return (
              <MenuItem key={item.value} value={item.value}>
                {get(schema.config, 'groupConfig.group.renderMenuItem')
                  ? get(schema.config, 'groupConfig.group.renderMenuItem')(
                      item.value,
                      item
                    )
                  : item.label}
              </MenuItem>
            );
          })}
        </Select>
        {schema.config.clearable && (
          <IconButton
            sx={{ position: 'absolute', right: '-32px' }}
            onClick={() => {
              if (onValueChange) {
                onValueChange(undefined);
              }
            }}
          >
            <Clear />
          </IconButton>
        )}
      </FormControl>
      {isGrouping && (
        <FormControl sx={{ flexGrow: 1 }}>
          <InputLabel id={schema.config.fieldId + '_child'}>
            {schema.config.groupConfig?.child?.label}
          </InputLabel>
          <Select
            variant='standard'
            labelId={schema.config.fieldId + '_child'}
            label={schema.config.groupConfig?.child?.label}
            size='small'
            value={
              get(value, get(schema.config, 'groupConfig.child.valueKey')) || ''
            }
            onChange={(e) => {
              if (onValueChange) {
                onValueChange({
                  ...value,
                  [schema.config.groupConfig?.child?.valueKey]: e.target.value,
                });
              }
            }}
            sx={{
              width: '100%',
            }}
            tabIndex={-1}
            inputProps={{
              tabIndex: -1,
            }}
          >
            {childOptions.map((item: any) => {
              return (
                <MenuItem
                  key={item.value}
                  value={item.value}
                  sx={{
                    background: 'white',
                  }}
                >
                  {get(schema.config, 'groupConfig.child.renderMenuItem')
                    ? get(schema.config, 'groupConfig.child.renderMenuItem')(
                        get(
                          value,
                          get(schema.config, 'groupConfig.group.valueKey')
                        ),
                        item.value,
                        item
                      )
                    : item.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
}

export default FieldSelect;
