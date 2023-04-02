import { Box } from '@mui/material';
import React, { useCallback, useRef, useLayoutEffect } from 'react';
import {
  StoryletBranchNode,
  StoryletNode,
  StoryletNodeData,
  StoryletRootNode,
  StoryletSentenceNode,
} from '../../../../../models/story/storylet';
import { useStoryStore } from '../../../../../store';
import { animation, borderRadius } from '../../../../../theme';

export default function BaseNodeCard({
  pos,
  node,
  color,
  children,
}: {
  node: StoryletNode<StoryletNodeData>;
  pos: { x: number; y: number };
  color: { normal: string; hover: string; active?: string };
  children: React.ReactNode;
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
  } = useStoryStore();
  const viewRef = useRef<HTMLElement>();
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
    selectNode(node.id);
  }, [node.id]);

  const onKeyDown = useCallback(
    (e) => {
      if (!isSelecting) {
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
        // duplicate
        if (e.shiftKey && !(node instanceof StoryletRootNode)) {
          const newNode = duplicateNode();
          insertFn(newNode, node);
        } else {
          const sentenceNode = new StoryletSentenceNode();
          insertFn(sentenceNode, node);
        }
      }

      // Esc
      if (e.keyCode === 8 && !(node instanceof StoryletRootNode)) {
        deleteNode(node.id);
      }

      moveSelection(e.key);
    },
    [
      isSelecting,
      insertChildNode,
      insertSiblingNode,
      moveSelection,
      deleteNode,
      updateTranslateKeyAll,
      getTranslationsForKey,
    ]
  );

  return (
    <Box
      id={node.id}
      ref={viewRef}
      sx={{
        position: 'absolute',
        p: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor: !isSelecting
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
        zIndex: isSelecting ? 2 : 1,
      }}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      {children}
    </Box>
  );
}