import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import {
  Banner,
  Button,
  ConfirmDialog,
  Divider,
  EmptyState,
  Input,
  ListRow,
  ScreenHeader,
  SearchField,
  SectionLabel,
  Sheet,
  SheetAction,
  Text,
} from '@/components/ui';
import { fileSize, relativeTime } from '@/lib/format';
import {
  breadcrumb,
  childDocuments,
  childFolders,
  countFolderContents,
  useActions,
  useData,
  userName,
} from '@/lib/mock/store';
import type { DocumentFile, Folder } from '@/lib/mock/types';
import { useCurrentUser, useSession } from '@/stores/session';
import { colors, radii, spacing } from '@/theme';

const MAX_DEPTH = 10; // FR-DOC-3
const MAX_UPLOAD_MB = 50; // FR-DOC-6

type PendingUpload = {
  name: string;
  sizeBytes: number;
  mimeType: DocumentFile['mimeType'];
  progress: number;
};

/** The shared file tree — requirements §4.4. One global tree, every user sees all of it. */
export function DocumentsScreen() {
  const db = useData();
  const actions = useActions();
  const user = useCurrentUser();
  const { isAdmin } = useSession();

  const [folderId, setFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [uploadSheet, setUploadSheet] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [upload, setUpload] = useState<PendingUpload | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [rejection, setRejection] = useState<string | null>(null);
  const [folderMenu, setFolderMenu] = useState<Folder | null>(null);
  const [fileMenu, setFileMenu] = useState<DocumentFile | null>(null);
  const [renaming, setRenaming] = useState<{
    kind: 'folder' | 'file';
    id: string;
    name: string;
  } | null>(null);
  const [confirmFolderDelete, setConfirmFolderDelete] = useState<Folder | null>(null);
  const [confirmFileDelete, setConfirmFileDelete] = useState<DocumentFile | null>(null);

  const trail = breadcrumb(db, folderId);
  const current = trail[trail.length - 1];
  const depth = current ? current.depth + 1 : 0;

  const folders = childFolders(db, folderId);
  const files = childDocuments(db, folderId);

  // FR-DOC-11 — search spans the whole tree, not the current folder.
  const needle = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (needle.length === 0) return null;
    return {
      folders: db.folders.filter((f) => f.name.toLowerCase().includes(needle)),
      files: db.documents.filter((d) => d.name.toLowerCase().includes(needle)),
    };
  }, [db.folders, db.documents, needle]);

  const siblingNames = folders.map((f) => f.name.toLowerCase());
  const folderNameTaken = siblingNames.includes(newFolderName.trim().toLowerCase());

  const startUpload = (pending: Omit<PendingUpload, 'progress'>) => {
    setUploadSheet(false);

    // FR-DOC-5 / FR-DOC-6 — rejected before any bytes move.
    if (pending.sizeBytes > MAX_UPLOAD_MB * 1024 * 1024) {
      setRejection(
        `"${pending.name}" is ${fileSize(pending.sizeBytes)}. The limit is ${MAX_UPLOAD_MB} MB, so it was not uploaded.`,
      );
      return;
    }

    setRejection(null);
    setUploadFailed(false);
    setUpload({ ...pending, progress: 0 });

    // FR-DOC-7 — visible progress. A stubbed ticker in the prototype.
    let progress = 0;
    const tick = setInterval(() => {
      progress += 0.12;
      if (progress >= 1) {
        clearInterval(tick);
        setUpload(null);
        actions.addDocument(folderId, pending, user.id);
        return;
      }
      setUpload((prev) => (prev ? { ...prev, progress } : prev));
    }, 220);
  };

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="Documents"
          subtitle={current ? current.path : 'All files'}
          showBack={folderId !== null}
          onBack={() => setFolderId(current?.parentId ?? null)}
          actions={[
            {
              icon: 'folder-open-outline',
              label: 'New folder',
              onPress: () => setNewFolderOpen(true),
            },
            { icon: 'cloud-upload-outline', label: 'Upload', onPress: () => setUploadSheet(true) },
          ]}
        />
      }
    >
      <View style={styles.controls}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search all files and folders"
        />
        {searchResults === null ? <Breadcrumb trail={trail} onNavigate={setFolderId} /> : null}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {rejection ? (
          <View style={styles.inset}>
            <Banner
              tone="danger"
              title="File not accepted"
              body={rejection}
              onDismiss={() => setRejection(null)}
            />
          </View>
        ) : null}

        {upload ? (
          <View style={styles.inset}>
            <UploadProgress
              upload={upload}
              onCancel={() => setUpload(null)}
              // A 10 MB+ file on cellular gets a warning — requirements §8.2.
              warnLarge={upload.sizeBytes > 10 * 1024 * 1024}
            />
          </View>
        ) : null}

        {uploadFailed ? (
          <View style={styles.inset}>
            <Banner
              tone="danger"
              title="Upload failed"
              body="The connection dropped partway through. The file is still selected, so you can retry without picking it again."
              onDismiss={() => setUploadFailed(false)}
            />
          </View>
        ) : null}

        {searchResults ? (
          <SearchResults
            results={searchResults}
            onOpenFolder={(id) => {
              setQuery('');
              setFolderId(id);
            }}
            onOpenFile={(id) => router.push(`/documents/${id}`)}
            db={db}
          />
        ) : folders.length === 0 && files.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title={current ? `${current.name} is empty` : 'No files yet'}
            body={
              current
                ? 'Upload a file here, or create a folder to organise what goes in it.'
                : 'This is the shared file tree — everyone on the team sees the same thing. Start with a folder.'
            }
            actionLabel="Upload a file"
            onAction={() => setUploadSheet(true)}
          />
        ) : (
          <>
            {folders.length > 0 ? (
              <>
                <SectionLabel>Folders</SectionLabel>
                <View style={styles.card}>
                  {folders.map((folder, index) => {
                    const count = countFolderContents(db, folder.id);
                    return (
                      <View key={folder.id}>
                        {index > 0 ? <Divider inset /> : null}
                        <ListRow
                          icon="folder"
                          title={folder.name}
                          subtitle={
                            count === 0 ? 'Empty' : `${count} item${count === 1 ? '' : 's'}`
                          }
                          onPress={() => setFolderId(folder.id)}
                          trailing={
                            <RowMenuButton
                              label={`Actions for ${folder.name}`}
                              onPress={() => setFolderMenu(folder)}
                            />
                          }
                          showChevron={false}
                        />
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}

            {files.length > 0 ? (
              <>
                <SectionLabel>Files</SectionLabel>
                <View style={styles.card}>
                  {files.map((file, index) => (
                    <View key={file.id}>
                      {index > 0 ? <Divider inset /> : null}
                      <ListRow
                        icon={iconFor(file.mimeType)}
                        iconTone="muted"
                        title={file.name}
                        titleLines={2}
                        // FR-DOC-12 — name, type, size, uploader, date.
                        subtitle={`${labelFor(file.mimeType)} · ${fileSize(file.sizeBytes)}`}
                        meta={`${userName(db, file.uploadedBy)} · ${relativeTime(file.createdAt)}`}
                        onPress={() => router.push(`/documents/${file.id}`)}
                        trailing={
                          <RowMenuButton
                            label={`Actions for ${file.name}`}
                            onPress={() => setFileMenu(file)}
                          />
                        }
                        showChevron={false}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <Text variant="caption" tone="subtle" style={styles.foot}>
              Files open over an expiring, signed link — they are never publicly accessible. PDF,
              JPEG, PNG and HEIC up to {MAX_UPLOAD_MB} MB.
            </Text>
          </>
        )}
      </ScrollView>

      {/* Upload picker — FR-DOC-4 */}
      <Sheet visible={uploadSheet} onClose={() => setUploadSheet(false)} title="Add to this folder">
        <SheetAction
          icon="document-outline"
          label="Choose a file"
          description="PDF, JPEG, PNG or HEIC, up to 50 MB."
          onPress={() =>
            startUpload({
              name: 'Tray Configuration — Revision Set.pdf',
              sizeBytes: 3_400_000,
              mimeType: 'application/pdf',
            })
          }
        />
        <SheetAction
          icon="images-outline"
          label="Choose from photo library"
          onPress={() =>
            startUpload({ name: 'Tray photo.jpg', sizeBytes: 2_800_000, mimeType: 'image/jpeg' })
          }
        />
        <SheetAction
          icon="camera-outline"
          label="Take a photo"
          description="Useful for tray layouts and whiteboards."
          onPress={() =>
            startUpload({ name: 'Photo.heic', sizeBytes: 4_600_000, mimeType: 'image/heic' })
          }
        />
        <Divider />
        <SheetAction
          icon="warning-outline"
          label="Try an oversized file (60 MB)"
          description="Prototype only — shows the rejection before any upload starts."
          onPress={() =>
            startUpload({
              name: 'Full Product Catalogue 2026.pdf',
              sizeBytes: 62_914_560,
              mimeType: 'application/pdf',
            })
          }
        />
        <SheetAction
          icon="flask-outline"
          label="Simulate a failed upload"
          description="Prototype only — shows the retry path."
          onPress={() => {
            setUploadSheet(false);
            setUploadFailed(true);
          }}
        />
      </Sheet>

      {/* Create folder — FR-DOC-3 */}
      <Sheet visible={newFolderOpen} onClose={() => setNewFolderOpen(false)} title="New folder">
        <Input
          label="Folder name"
          value={newFolderName}
          onChangeText={setNewFolderName}
          placeholder="Knee Systems"
          maxLength={100}
          showCounter
          autoFocus
          error={
            folderNameTaken
              ? 'A folder with that name already exists here.'
              : depth >= MAX_DEPTH
                ? `Folders can only be nested ${MAX_DEPTH} deep.`
                : undefined
          }
        />
        <Button
          label="Create folder"
          onPress={() => {
            actions.addFolder(folderId, newFolderName.trim(), user.id);
            setNewFolderName('');
            setNewFolderOpen(false);
          }}
          disabled={newFolderName.trim().length === 0 || folderNameTaken || depth >= MAX_DEPTH}
          fullWidth
          style={styles.spaced}
        />
        <Text variant="caption" tone="subtle" style={styles.spaced}>
          Creating in {current ? current.path : '/'} · level {depth + 1} of {MAX_DEPTH}
        </Text>
      </Sheet>

      {/* Folder actions — FR-DOC-10 */}
      <Sheet
        visible={folderMenu !== null}
        onClose={() => setFolderMenu(null)}
        title={folderMenu?.name ?? ''}
      >
        <SheetAction
          icon="pencil-outline"
          label="Rename"
          onPress={() => {
            const folder = folderMenu;
            setFolderMenu(null);
            if (folder) setRenaming({ kind: 'folder', id: folder.id, name: folder.name });
          }}
        />
        <SheetAction
          icon="trash-outline"
          label="Delete folder"
          tone="danger"
          description={
            folderMenu && folderMenu.createdBy === user.id
              ? 'You created this folder.'
              : isAdmin
                ? 'You can delete this as an admin.'
                : 'Only the creator or an admin can delete this.'
          }
          onPress={() => {
            const folder = folderMenu;
            setFolderMenu(null);
            setConfirmFolderDelete(folder);
          }}
        />
      </Sheet>

      {/* File actions — FR-DOC-9, FR-DOC-10 */}
      <Sheet
        visible={fileMenu !== null}
        onClose={() => setFileMenu(null)}
        title={fileMenu?.name ?? ''}
      >
        <SheetAction
          icon="open-outline"
          label="Open"
          onPress={() => {
            const file = fileMenu;
            setFileMenu(null);
            if (file) router.push(`/documents/${file.id}`);
          }}
        />
        <SheetAction
          icon="share-outline"
          label="Share or export"
          description="Hands the file to the system share sheet."
          onPress={() => setFileMenu(null)}
        />
        <SheetAction
          icon="pencil-outline"
          label="Rename"
          onPress={() => {
            const file = fileMenu;
            setFileMenu(null);
            if (file) setRenaming({ kind: 'file', id: file.id, name: file.name });
          }}
        />
        <SheetAction
          icon="trash-outline"
          label="Delete"
          tone="danger"
          onPress={() => {
            const file = fileMenu;
            setFileMenu(null);
            setConfirmFileDelete(file);
          }}
        />
      </Sheet>

      <Sheet visible={renaming !== null} onClose={() => setRenaming(null)} title="Rename">
        <Input
          label={renaming?.kind === 'folder' ? 'Folder name' : 'File name'}
          value={renaming?.name ?? ''}
          onChangeText={(name) => setRenaming((prev) => (prev ? { ...prev, name } : prev))}
          maxLength={100}
          showCounter
          autoFocus
        />
        <Button
          label="Save name"
          onPress={() => {
            if (!renaming) return;
            if (renaming.kind === 'folder') actions.renameFolder(renaming.id, renaming.name.trim());
            else actions.renameDocument(renaming.id, renaming.name.trim());
            setRenaming(null);
          }}
          disabled={(renaming?.name.trim().length ?? 0) === 0}
          fullWidth
          style={styles.spaced}
        />
      </Sheet>

      {/* FR-DOC-10 — a non-empty folder needs typed confirmation and an item count. */}
      <ConfirmDialog
        visible={confirmFolderDelete !== null}
        title={`Delete "${confirmFolderDelete?.name ?? ''}"?`}
        body={
          confirmFolderDelete && countFolderContents(db, confirmFolderDelete.id) > 0
            ? `This folder contains ${countFolderContents(db, confirmFolderDelete.id)} item${countFolderContents(db, confirmFolderDelete.id) === 1 ? '' : 's'}, and all of them will be removed for everyone. Type the folder name to confirm.`
            : 'This folder is empty. It will be removed for everyone.'
        }
        confirmLabel="Delete"
        destructive
        typeToConfirm={
          confirmFolderDelete && countFolderContents(db, confirmFolderDelete.id) > 0
            ? confirmFolderDelete.name
            : undefined
        }
        onCancel={() => setConfirmFolderDelete(null)}
        onConfirm={() => {
          const folder = confirmFolderDelete;
          setConfirmFolderDelete(null);
          if (folder) actions.deleteFolder(folder.id);
        }}
      />

      <ConfirmDialog
        visible={confirmFileDelete !== null}
        title={`Delete "${confirmFileDelete?.name ?? ''}"?`}
        body="It will be removed from the shared tree for everyone. Deletions are soft, so an administrator can still recover it."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmFileDelete(null)}
        onConfirm={() => {
          const file = confirmFileDelete;
          setConfirmFileDelete(null);
          if (file) actions.deleteDocument(file.id);
        }}
      />
    </Screen>
  );
}

/** FR-DOC-2 — the trail navigates to any ancestor, not just one level up. */
function Breadcrumb({
  trail,
  onNavigate,
}: {
  trail: Folder[];
  onNavigate: (id: string | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.crumbs}
    >
      <Pressable onPress={() => onNavigate(null)} accessibilityRole="button" hitSlop={6}>
        <Text variant="label" tone={trail.length === 0 ? 'default' : 'primary'}>
          All files
        </Text>
      </Pressable>
      {trail.map((folder, index) => (
        <View key={folder.id} style={styles.crumb}>
          <Ionicons name="chevron-forward" size={13} color={colors.textSubtle} />
          <Pressable onPress={() => onNavigate(folder.id)} accessibilityRole="button" hitSlop={6}>
            <Text variant="label" tone={index === trail.length - 1 ? 'default' : 'primary'}>
              {folder.name}
            </Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function UploadProgress({
  upload,
  onCancel,
  warnLarge,
}: {
  upload: PendingUpload;
  onCancel: () => void;
  warnLarge: boolean;
}) {
  return (
    <View style={styles.upload}>
      <View style={styles.uploadHead}>
        <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
        <Text variant="label" numberOfLines={1} style={styles.flex}>
          {upload.name}
        </Text>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel upload"
          hitSlop={10}
        >
          <Text variant="caption" tone="primary">
            Cancel
          </Text>
        </Pressable>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(upload.progress * 100)}%` }]} />
      </View>

      <Text variant="caption" tone="subtle">
        {Math.round(upload.progress * 100)}% of {fileSize(upload.sizeBytes)}
      </Text>

      {warnLarge ? (
        <Text variant="caption" tone="warning">
          Large file on a cellular connection — this may take a while. Wi-Fi is faster and less
          likely to drop.
        </Text>
      ) : null}
    </View>
  );
}

function SearchResults({
  results,
  onOpenFolder,
  onOpenFile,
  db,
}: {
  results: { folders: Folder[]; files: DocumentFile[] };
  onOpenFolder: (id: string) => void;
  onOpenFile: (id: string) => void;
  db: ReturnType<typeof useData>;
}) {
  const total = results.folders.length + results.files.length;

  if (total === 0) {
    return (
      <EmptyState
        icon="search-outline"
        title="Nothing found"
        body="No file or folder name matches. Searching inside document contents isn't available in this version."
      />
    );
  }

  return (
    <>
      <SectionLabel>{`${total} result${total === 1 ? '' : 's'} across all folders`}</SectionLabel>
      <View style={styles.card}>
        {results.folders.map((folder, index) => (
          <View key={folder.id}>
            {index > 0 ? <Divider inset /> : null}
            <ListRow
              icon="folder"
              title={folder.name}
              subtitle={folder.path}
              onPress={() => onOpenFolder(folder.id)}
            />
          </View>
        ))}
        {results.files.map((file, index) => {
          const parent = file.folderId ? db.folders.find((f) => f.id === file.folderId) : undefined;
          return (
            <View key={file.id}>
              {index > 0 || results.folders.length > 0 ? <Divider inset /> : null}
              <ListRow
                icon={iconFor(file.mimeType)}
                iconTone="muted"
                title={file.name}
                titleLines={2}
                subtitle={parent ? parent.path : '/'}
                meta={`${labelFor(file.mimeType)} · ${fileSize(file.sizeBytes)}`}
                onPress={() => onOpenFile(file.id)}
              />
            </View>
          );
        })}
      </View>
    </>
  );
}

function RowMenuButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={styles.rowMenu}
    >
      <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

export function iconFor(mimeType: DocumentFile['mimeType']) {
  return mimeType === 'application/pdf' ? ('document-text' as const) : ('image' as const);
}

export function labelFor(mimeType: DocumentFile['mimeType']): string {
  switch (mimeType) {
    case 'application/pdf':
      return 'PDF';
    case 'image/jpeg':
      return 'JPEG image';
    case 'image/png':
      return 'PNG image';
    case 'image/heic':
      return 'HEIC image';
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  controls: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  crumbs: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingRight: spacing.lg },
  crumb: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  list: { paddingBottom: spacing.xxxl },
  inset: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rowMenu: { width: 28, alignItems: 'flex-end' },
  upload: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  uploadHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  track: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: radii.pill, backgroundColor: colors.primary },
  spaced: { marginTop: spacing.md },
  foot: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, textAlign: 'center' },
});
