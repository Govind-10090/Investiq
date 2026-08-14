import { useState, useEffect } from "react";
import {
  NotebookPen, Plus, Trash2, Pencil, X, Search, Tag, TrendingUp, BookOpen, Filter
} from "lucide-react";
import { useNotesStore, useMarketStore, useAuthStore } from "../../store";
import type { Note } from "../../store/useNotesStore";

// ─── Tag Pill ───────────────────────────────────────────────────────────────
function AssetTag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-medium uppercase tracking-wider">
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-red-400 transition-colors ml-0.5">
          <X className="size-2.5" />
        </button>
      )}
    </span>
  );
}

// ─── Note Card ───────────────────────────────────────────────────────────────
function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="group bg-card border border-border/40 rounded-xl p-5 flex flex-col gap-3 hover:border-emerald-500/30 transition-all shadow-md hover:shadow-emerald-500/5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground leading-snug flex-1">{note.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      {note.content && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{note.content}</p>
      )}

      {/* Asset Tags */}
      {note.assets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {note.assets.map((sym) => (
            <AssetTag key={sym} label={sym} />
          ))}
        </div>
      )}

      {/* Custom Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {note.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium"
            >
              <Tag className="size-2.5" />
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground/60 mt-auto pt-2 border-t border-border/20">
        {note.updatedAt !== note.createdAt ? `Edited ${timeAgo(note.updatedAt)}` : `Created ${timeAgo(note.createdAt)}`}
      </p>
    </div>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────
function NoteModal({
  note,
  onClose,
  onSave,
}: {
  note?: Partial<Note>;
  onClose: () => void;
  onSave: (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const { assets } = useMarketStore();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [selectedAssets, setSelectedAssets] = useState<string[]>(note?.assets ?? []);
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [assetSearch, setAssetSearch] = useState("");

  const filteredAssets = assets
    .filter(
      (a) =>
        (a.symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
          a.name.toLowerCase().includes(assetSearch.toLowerCase())) &&
        !selectedAssets.includes(a.symbol)
    )
    .slice(0, 10);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), content, assets: selectedAssets, tags });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="w-full max-w-xl bg-card border border-border/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/40">
          <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
            <NotebookPen className="size-5 text-emerald-400" />
            {note?.id ? "Edit Note" : "New Investment Note"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Note Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 strategy for tech stocks..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 bg-background border border-border/40 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Content</label>
            <textarea
              placeholder="Write your investment thesis, analysis, or reminder..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 bg-background border border-border/40 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Asset Tagging */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Tag Assets</label>

            {/* Selected */}
            {selectedAssets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedAssets.map((sym) => (
                  <AssetTag
                    key={sym}
                    label={sym}
                    onRemove={() => setSelectedAssets(selectedAssets.filter((s) => s !== sym))}
                  />
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search symbol or name to tag..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-background border border-border/40 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Asset dropdown */}
            {assetSearch && filteredAssets.length > 0 && (
              <div className="border border-border/30 rounded-lg bg-background divide-y divide-border/20 max-h-40 overflow-y-auto">
                {filteredAssets.map((a) => (
                  <button
                    key={a.symbol}
                    type="button"
                    onClick={() => {
                      setSelectedAssets([...selectedAssets, a.symbol]);
                      setAssetSearch("");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted text-left transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">{a.symbol}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{a.name}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase border border-border/30">
                      {a.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Tags */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Custom Tags</label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400"
                  >
                    <Tag className="size-2.5" />
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-red-400 ml-0.5">
                      <X className="size-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a tag (e.g. bullish, long-term)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                className="flex-1 h-9 px-3 bg-background border border-border/40 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 bg-muted hover:bg-accent border border-border/40 rounded-lg text-xs text-foreground transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-muted hover:bg-accent text-xs text-foreground rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-xs text-white rounded-lg font-medium transition-colors"
            >
              {note?.id ? "Save Changes" : "Create Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Notes Page ──────────────────────────────────────────────────────────
export function Notes() {
  const { user } = useAuthStore();
  const { notes, fetchNotes, addNote, updateNote, deleteNote, loading } = useNotesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [filterAsset, setFilterAsset] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.uid) fetchNotes(user.uid);
  }, [user?.uid, fetchNotes]);

  const handleSave = async (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    if (!user?.uid) return;
    if (editingNote) {
      await updateNote(user.uid, editingNote.id, data);
    } else {
      await addNote(user.uid, data);
    }
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    if (confirm("Delete this note?")) {
      await deleteNote(user.uid, id);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  // Get all unique asset tags across notes
  const allTaggedAssets = Array.from(new Set(notes.flatMap((n) => n.assets)));

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchAsset = filterAsset ? n.assets.includes(filterAsset) : true;
    const matchSearch =
      searchQuery === "" ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.assets.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchAsset && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium flex items-center gap-2">
            <NotebookPen className="size-6 text-emerald-400" />
            Investment Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture investment ideas, analysis, and strategies — tag assets for quick lookup
          </p>
        </div>

        <button
          onClick={() => { setEditingNote(null); setIsModalOpen(true); }}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="size-4" /> New Note
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Total Notes</p>
          <p className="text-2xl text-foreground font-bold mt-1">{notes.length}</p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Assets Tagged</p>
          <p className="text-2xl text-emerald-400 font-bold mt-1">{allTaggedAssets.length}</p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">This Week</p>
          <p className="text-2xl text-blue-400 font-bold mt-1">
            {notes.filter((n) => {
              const d = new Date(n.createdAt);
              return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
            }).length}
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Filtered View</p>
          <p className="text-2xl text-foreground font-bold mt-1">{filteredNotes.length}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes, assets, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-card border border-border/40 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Asset Filter Pills */}
        {allTaggedAssets.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="size-3.5 text-muted-foreground shrink-0" />
            <button
              onClick={() => setFilterAsset(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                !filterAsset
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {allTaggedAssets.map((sym) => (
              <button
                key={sym}
                onClick={() => setFilterAsset(filterAsset === sym ? null : sym)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase ${
                  filterAsset === sym
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border/40 rounded-xl p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes
            .slice()
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => handleEdit(note)}
                onDelete={() => handleDelete(note.id)}
              />
            ))}
        </div>
      ) : (
        <div className="bg-card border border-border/40 rounded-xl p-16 text-center">
          <BookOpen className="size-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-foreground font-medium mb-1">
            {notes.length === 0 ? "No notes yet" : "No notes match your filter"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {notes.length === 0
              ? "Click \"New Note\" to capture your first investment insight"
              : "Try clearing filters or searching for something else"}
          </p>
          {notes.length === 0 && (
            <button
              onClick={() => { setEditingNote(null); setIsModalOpen(true); }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium"
            >
              Create First Note
            </button>
          )}
        </div>
      )}

      {/* Note Modal */}
      {isModalOpen && (
        <NoteModal
          note={editingNote ?? undefined}
          onClose={() => { setIsModalOpen(false); setEditingNote(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
