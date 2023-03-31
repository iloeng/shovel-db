import * as remote from "@electron/remote";
import ArticleIcon from "@mui/icons-material/Article";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { Box, Stack, TextField } from "@mui/material";
import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { grey } from "@mui/material/colors";
import { File, Folder } from "../../../models/explorer";
import { useExplorerStore } from "../../../store";

export default function Explorer() {
  const [uncollapsedFolders, setUncollapsedFolders] = useState<string[]>([]);

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);

  const { currentOpenFile, openFile, fileTree, updateItem, deleteItem } =
    useExplorerStore();

  const fileContextMenu = [
    {
      label: "Rename",
      click: (file: File) => {
        setEditingName(file.name);
        setEditingItem(file.id);
      },
    },
    {
      label: "Copy",
      click: () => {
        console.log("Copy");
      },
    },
    {
      label: "Delete",
      click: (file: File) => {
        deleteItem(file.id);
      },
    },
  ];

  const TreeItem = ({
    data,
    index,
  }: {
    data: File | Folder;
    index: number;
  }) => {
    const [{ isDragging }, dragRef] = useDrag(
      () => ({
        type: data instanceof File ? "file" : "folder",
        item: data,
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
      }),
      []
    );

    const [{ isOver, canDrop }, drop] = useDrop(
      () => ({
        accept: "all",
        canDrop: () => {
          console.log("dsds: ");
          return true;
        },
        drop: () => {
          console.log("drop");
        },
        collect: (monitor) => ({
          isOver: !!monitor.isOver(),
          canDrop: !!monitor.canDrop(),
        }),
      }),
      []
    );

    if (data instanceof Folder) {
      const isCollapsed = !uncollapsedFolders.find((item) => item === data.id);
      return (
        <>
          <Stack
            key={data.id}
            direction="row"
            spacing={0.5}
            sx={{
              p: 0.5,
              "&:hover": {
                cursor: "pointer",
                backgroundColor: "secondary.light",
              },
              userSelect: "none",
              /* backgroundColor: !isOver && canDrop ? grey[500] : "inherit", */
            }}
            onClick={() => {
              if (uncollapsedFolders.find((item) => item === data.id)) {
                setUncollapsedFolders(
                  uncollapsedFolders.filter((f) => f !== data.id)
                );
              } else {
                setUncollapsedFolders([...uncollapsedFolders, data.id]);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              const menu = new remote.Menu();

              const folderContextMenu = [
                {
                  label: "New File",
                  click: () => {
                    console.log("New File");
                  },
                },
                {
                  label: "New Folder",
                  click: () => {
                    console.log("New Folder");
                  },
                },
                {
                  label: "Rename",
                  click: (folder: Folder) => {
                    setEditingName(folder.name);
                    setEditingItem(folder.id);
                  },
                },
                {
                  label: "Delete",
                  click: (folder: Folder) => {
                    deleteItem(folder.id);
                  },
                },
              ];
              folderContextMenu.forEach((item) => {
                menu.append(
                  new remote.MenuItem({
                    label: item.label,
                    click: () => item.click(data),
                  })
                );
              });
              menu.popup({ window: remote.getCurrentWindow() });
            }}
          >
            <Stack direction="row" spacing={0}>
              {!isCollapsed ? (
                <>
                  <ExpandMoreIcon />
                  <FolderOpenIcon />
                </>
              ) : (
                <>
                  <ExpandLessIcon />
                  <FolderIcon />
                </>
              )}
            </Stack>
            {editingItem === data.id && (
              <TextField
                variant="standard"
                inputProps={{
                  style: {
                    color: "#fff",
                  },
                }}
                value={editingName}
                autoFocus
                onChange={(e) => {
                  setEditingName(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    data.name = editingName || "";
                    updateItem(data.id, data);
                    setEditingItem(null);
                    setEditingName(null);
                  }

                  if (e.key === "Escape") {
                    setEditingItem(null);
                    setEditingName(null);
                  }
                }}
              />
            )}
            {editingItem !== data.id && (
              <div ref={dragRef} style={{ opacity: isDragging ? 0.5 : 1 }}>
                {data.name}
              </div>
            )}
          </Stack>
          {!isCollapsed && (
            <Stack sx={{ pl: 4 }} spacing={1} ref={drop}>
              {data.children.map((item, i) => {
                return <TreeItem key={item.id} data={item} index={i} />;
              })}
            </Stack>
          )}
        </>
      );
    }

    return (
      <Stack
        key={data.id}
        direction="row"
        spacing={0.5}
        sx={{
          px: 0.5,
          backgroundColor:
            currentOpenFile === data ? "secondary.light" : "inherit",
          "&:hover": {
            cursor: "pointer",
            backgroundColor: "secondary.light",
          },
          userSelect: "none",
        }}
        onClick={() => {
          openFile(data);
        }}
        onDoubleClick={() => {
          setEditingName(data.name);
          setEditingItem(data.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const menu = new remote.Menu();
          fileContextMenu.forEach((item) => {
            menu.append(
              new remote.MenuItem({
                label: item.label,
                click: () => item.click(data),
              })
            );
          });
          menu.popup({ window: remote.getCurrentWindow() });
        }}
      >
        <ArticleIcon />
        {editingItem === data.id && (
          <TextField
            variant="standard"
            inputProps={{
              style: {
                color: "#fff",
              },
            }}
            value={editingName}
            autoFocus
            onChange={(e) => {
              setEditingName(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                data.name = editingName || "";
                updateItem(data.id, data);
                setEditingItem(null);
                setEditingName(null);
              }
              if (e.key === "Escape") {
                setEditingItem(null);
                setEditingName(null);
              }
            }}
          />
        )}
        {editingItem !== data.id && (
          <div ref={dragRef} style={{ opacity: isDragging ? 0.5 : 1 }}>
            {data.name}
          </div>
        )}
      </Stack>
    );
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "300px",
        backgroundColor: "secondary.main",
        color: "secondary.contrastText",
        overflowY: "overlay",
        p: 2,
      }}
    >
      <DndProvider backend={HTML5Backend}>
        <Stack spacing={1}>
          {fileTree.map((file, i) => {
            return <TreeItem key={file.id} data={file} index={i} />;
          })}
        </Stack>
      </DndProvider>
    </Box>
  );
}