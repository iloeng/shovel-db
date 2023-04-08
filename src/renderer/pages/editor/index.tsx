import { Box, Stack, CircularProgress, FormLabel } from '@mui/material';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useExplorerStore, useStoryStore } from '../../store';
import { Mode, useEditorStore } from '../../store/editor';
import { useProjectStore } from '../../store/project';
import { useTrackStore } from '../../store/track';
import { grey } from '@mui/material/colors';
import { borderRadius } from '../../theme';
import Explorer from './components/explorer';
import Main from './main';
import SearchPanel from './components/search_panel';

export default function Editor() {
  const { undo, redo } = useTrackStore();
  const { mode } = useEditorStore();

  const {
    story,
    nodeSettings,
    translations: storyTranslations,
    storyActors,
  } = useStoryStore();
  const { files } = useExplorerStore();
  const { save } = useProjectStore();
  const [saving, setSaving] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);

  useEffect(() => {
    const handle = async (e) => {
      if (mode !== Mode.Normal) {
        return;
      }
      if (e.code === 'KeyZ' && e.ctrlKey) {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if (e.code === 'KeyS' && e.ctrlKey) {
        setSaving(true);
        await save({
          story,
          storyActors,
          storyTranslations,
          storyNodeSettings: nodeSettings,
          files,
          staticData: {},
        });
        setTimeout(() => {
          setSaving(false);
        }, 500);
      }

      if (e.code === 'KeyP' && e.ctrlKey) {
        e.preventDefault();
        setSearchPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handle);
    return () => {
      window.removeEventListener('keydown', handle);
    };
  }, [
    undo,
    redo,
    mode,
    save,
    story,
    storyActors,
    nodeSettings,
    storyTranslations,
    files,
  ]);

  return (
    <Box>
      <Stack direction={'row'} sx={{ height: '100%', width: '100%' }}>
        <Explorer />
        <Main>
          {saving ? (
            <>
              <Stack
                direction='row'
                spacing={2}
                sx={{
                  backgroundColor: grey[50],
                  position: 'absolute',
                  top: '24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '150px',
                  height: '50px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...borderRadius.larger,
                }}
              >
                <CircularProgress
                  sx={{ height: '24px!important', width: '24px!important' }}
                />
                <FormLabel>Saving...</FormLabel>
              </Stack>
            </>
          ) : null}
        </Main>
        {searchPanelOpen && (
          <SearchPanel
            close={() => {
              setSearchPanelOpen(false);
            }}
          />
        )}
      </Stack>
    </Box>
  );
}
