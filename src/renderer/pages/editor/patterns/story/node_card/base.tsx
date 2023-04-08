import { Box, Container, Divider, Stack } from '@mui/material';
import { clipboard } from 'electron';
import * as d3 from 'd3';
import React, { useCallback, useRef, useLayoutEffect, useState } from 'react';
import { grey } from '@mui/material/colors';
import {
  StoryletBranchNode,
  StoryletNode,
  StoryletNodeData,
  StoryletRootNode,
  StoryletSentenceNode,
  StoryletActionNode,
  Storylet,
} from '../../../../../models/story/storylet';
import { useStoryStore } from '../../../../../store';
import { Mode, useEditorStore } from '../../../../../store/editor';
import { trackState } from '../../../../../store/track';
import { animation, borderRadius } from '../../../../../theme';
import EditDialog from '../edit_dialog';
import Grid2 from '@mui/material/Unstable_Grid2';

export default function BaseNodeCard({
  pos,
  node,
  color,
  children,
  onDrag,
  onDragEnd,
}: {
  node: StoryletNode<StoryletNodeData>;
  pos: { x: number; y: number };
  color: { normal: string; hover: string; active?: string };
  children: React.ReactNode;
  onDrag?: (val: any) => void;
  onDragEnd?: (val: any) => void;
}) {
  const {
    currentStorylet,
    selection,
    selectNode,
    insertChildNode,
    insertSiblingNode,
    moveSelection,
    deleteNode,
    updateTranslateKeyAll,
    getTranslationsForKey,
    trackCurrentState,
    tr,
  } = useStoryStore();
  const viewRef = useRef<HTMLElement>();
  const [editOpen, setEditOpen] = useState(false);
  const { setMode } = useEditorStore();
  const [isHover, setIsHover] = useState(false);
  const [isDraging, setIsDraging] = useState(false);
  if (!currentStorylet) {
    return null;
  }

  const isSelecting = selection?.nodeId === node.id;

  useLayoutEffect(() => {
    if (!viewRef.current) {
      return;
    }
    viewRef.current.tabIndex = isSelecting ? 1 : -1;
  }, [isSelecting]);

  const onSelect = useCallback(() => {
    if (editOpen) {
      return;
    }
    selectNode(node.id);
  }, [node.id, editOpen]);

  const onKeyDown = useCallback(
    (e) => {
      if (!isSelecting || editOpen) {
        return;
      }

      e.preventDefault();

      const duplicateNode = () => {
        const newNode = node.clone();
        if (
          (newNode instanceof StoryletSentenceNode ||
            newNode instanceof StoryletBranchNode) &&
          (node instanceof StoryletSentenceNode ||
            node instanceof StoryletBranchNode)
        ) {
          updateTranslateKeyAll(
            newNode.data.content,
            getTranslationsForKey(node.data.content)
          );
        }
        return newNode;
      };

      let insertFn: Function | null = null;
      // Enter
      if (e.keyCode === 13) {
        insertFn = insertSiblingNode;
      }
      // Tab
      if (e.keyCode === 9) {
        insertFn = insertChildNode;
      }
      if (insertFn) {
        let newNode: StoryletNode<StoryletNodeData> =
          new StoryletSentenceNode();
        if (e.ctrlKey) {
          newNode = new StoryletBranchNode();
          if (e.shiftKey) {
            newNode = new StoryletActionNode();
          }
        }
        insertFn(newNode, node);

        trackCurrentState();
        return;
      }

      if (e.code === 'KeyD' && e.ctrlKey) {
        const insertNodeFn = e.shiftKey ? insertSiblingNode : insertChildNode;
        const newNode = duplicateNode();
        insertNodeFn(newNode, node);
        return;
      }

      if (e.code === 'KeyC' && e.ctrlKey) {
        clipboard.writeText(JSON.stringify(node.toJson()));
        return;
      }

      if (e.code === 'KeyV' && e.ctrlKey) {
        const nodeJson = clipboard.readText();
        console.log('dsd');
        const newNode = Storylet.fromNodeJson({
          ...JSON.parse(nodeJson),
          id: undefined,
        });
        insertChildNode(newNode, node);
        return;
      }

      // Esc
      if (e.keyCode === 8 && !(node instanceof StoryletRootNode)) {
        deleteNode(node.id);
        trackCurrentState();
        return;
      }

      if (e.code === 'KeyE') {
        selectNode(null);

        setEditOpen(true);
        setMode(Mode.Popup);
        return;
      }

      moveSelection(e.key);
    },
    [
      editOpen,
      isSelecting,
      insertChildNode,
      insertSiblingNode,
      moveSelection,
      deleteNode,
      updateTranslateKeyAll,
      getTranslationsForKey,
      setMode,
      trackCurrentState,
    ]
  );

  const renderPopupItem = (content) => {
    return (
      <>
        <Grid2 xs sx={{ fontWeight: 'bold', fontSize: '2.5rem' }}>
          {content}
        </Grid2>
      </>
    );
  };
  const hasPopupContent =
    !!node.data.enableCheck ||
    (node instanceof StoryletActionNode && node.data.process);
  return (
    <Box
      id={node.id}
      ref={(dom) => {
        if (!dom) {
          return;
        }

        viewRef.current = dom as HTMLElement;
        const dragListener = d3
          .drag()
          .on('drag', (d) => {
            setIsDraging(true);
            setIsHover(false);
            if (onDrag) {
              onDrag(d);
            }
          })
          .on('end', (d) => {
            setIsDraging(false);
            if (onDragEnd) {
              onDragEnd(d);
            }
          });
        dragListener(d3.select(dom as any));
      }}
      sx={{
        position: 'absolute',
        p: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor:
          !isSelecting && !isDraging
            ? color.normal
            : color.active || color.hover,
        ...animation.autoFade,
        ...borderRadius.larger,
        fontSize: '2rem',
        transform: `translate(${pos.y}px,${pos.x}px)`,
        height: '200px',
        width: '400px',
        textOverflow: 'ellipsis',
        wordBreak: 'break-all',
        outline: 'none',
        '&:hover': {
          backgroundColor: color.hover,
        },
        zIndex: isHover ? 10 : isSelecting ? 2 : 1,
      }}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onMouseEnter={() => {
        if (!isDraging) {
          setIsHover(true);
        }
      }}
      onMouseLeave={() => {
        if (!isDraging) {
          setIsHover(false);
        }
      }}
    >
      {children}
      {node.data.customNodeId && (
        <Container
          sx={{
            position: 'absolute',
            top: '-80px',
            left: '50%',
            fontSize: '2.5rem',
            textAlign: 'center',
            color: 'common.white',
            fontWeight: 'bold',
            transform: 'translateX(-50%)',
          }}
        >
          {node.data.customNodeId}
        </Container>
      )}
      {(isSelecting || isHover) && !editOpen && hasPopupContent && (
        <Stack
          sx={{
            p: 2,
            position: 'absolute',
            top: '-350px',
            height: '250px',
            background: 'white',
            width: '600px',
            ...borderRadius.larger,
            left: '50%',
            transform: 'translateX(-50%)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Grid2 container spacing={4}>
            {node.data.enableCheck && renderPopupItem('Enable check')}
            {node instanceof StoryletActionNode &&
              node.data.process &&
              renderPopupItem('Process')}
          </Grid2>
        </Stack>
      )}

      {currentStorylet.getNodeSingleParent(node.id) instanceof
        StoryletBranchNode && (
        <Container
          sx={{
            position: 'absolute',
            top: '50%',
            left: '-170px',
            p: 1,
            ...borderRadius.larger,
            width: '160px',
            minHeight: '60px',
            maxHeight: '120px',
            overflow: 'hidden',
            textAlign: 'center',
            backgroundColor: grey[50],
            transform: 'translateY(-50%)',
          }}
        >
          {tr(node.data.option?.name || '')}
        </Container>
      )}
      {editOpen && (
        <EditDialog
          node={node}
          open={editOpen}
          close={() => {
            setEditOpen(false);
            setMode(Mode.Normal);
            setTimeout(() => {
              selectNode(node.id);
            }, 0);
          }}
        />
      )}
    </Box>
  );
}
