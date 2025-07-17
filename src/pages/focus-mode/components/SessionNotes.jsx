import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../context/AuthContext';

const SessionNotes = ({ 
  isOpen, 
  onToggle, 
  sessionId, 
  goalId, 
  onSaveNote,
  sessionNotes = [],
  onSessionNotesChange 
}) => {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('temporary'); // 'temporary' or 'permanent'
  const [editingNote, setEditingNote] = useState(null);
  const [editText, setEditText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const noteData = {
      id: Date.now(),
      content: newNote.trim(),
      type: noteType,
      createdAt: new Date().toISOString(),
      sessionId: sessionId
    };

    // Only update notes in one place to avoid double upload
    const updatedNotes = [...sessionNotes, noteData];
    onSessionNotesChange(updatedNotes);
    // Remove: onSaveNote?.(noteData);
    setNewNote('');
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setEditText(note.content);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;

    const updatedNotes = sessionNotes.map(note => 
      note.id === editingNote.id 
        ? { ...note, content: editText.trim() }
        : note
    );

    onSessionNotesChange(updatedNotes);
    setEditingNote(null);
    setEditText('');
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = sessionNotes.filter(note => note.id !== noteId);
    onSessionNotesChange(updatedNotes);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditText('');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const temporaryNotes = sessionNotes.filter(note => note.type === 'temporary');
  const permanentNotes = sessionNotes.filter(note => note.type === 'permanent');

  return (
    <div className={`fixed right-4 top-20 w-96 bg-surface border border-border rounded-lg shadow-lg transition-all duration-300 z-50 ${
      isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
    } ${isMinimized ? 'h-16 overflow-hidden' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="FileText" size={20} />
          <h3 className="text-lg font-heading-semibold text-text-primary">Session Notes</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            iconName={isMinimized ? "ChevronDown" : "ChevronUp"}
            title={isMinimized ? "Expand" : "Minimize"}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            iconName="X"
          />
        </div>
      </div>
      {!isMinimized && (
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Add Note Form */}
          <div className="bg-surface-800 rounded-lg p-4 mb-4 border border-border">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-1">
                  Note Type
                </label>
                <div className="flex space-x-2">
                  <Button
                    variant={noteType === 'temporary' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setNoteType('temporary')}
                    className="flex-1"
                  >
                    <Icon name="Clock" size={14} className="mr-1" /> Temporary
                  </Button>
                  <Button
                    variant={noteType === 'permanent' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setNoteType('permanent')}
                    className="flex-1"
                  >
                    <Icon name="Save" size={14} className="mr-1" /> Permanent
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-1">
                  {noteType === 'temporary' ? 'Quick Note' : 'Session Note'}
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={noteType === 'temporary' ? 'Quick thought or reminder...' : 'Detailed note about this session...'}
                  className="w-full px-3 py-2 bg-surface-700 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      handleAddNote();
                    }
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">
                  {noteType === 'temporary' ? 'Auto-deleted after session' : 'Saved permanently'}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  <Icon name="Plus" size={14} className="mr-1" /> Add Note
                </Button>
              </div>
            </div>
          </div>
          {/* Notes List */}
          <div className="space-y-4">
            {/* Temporary Notes */}
            {temporaryNotes.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Icon name="Clock" size={16} className="text-warning" />
                  <h4 className="text-sm font-heading-medium text-text-primary">Temporary Notes</h4>
                  <span className="text-xs text-text-secondary bg-warning/20 text-warning px-2 py-1 rounded-full">
                    {temporaryNotes.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {temporaryNotes.map(note => (
                    <div key={note.id} className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                      {editingNote?.id === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-2 py-1 bg-surface-700 border border-border rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleSaveEdit}
                              className="text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="group">
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-text-primary flex-1">{note.content}</p>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNote(note)}
                                iconName="Edit"
                                className="text-xs"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                                iconName="Trash2"
                                className="text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-text-secondary">
                              {formatTime(note.createdAt)}
                            </span>
                            <span className="text-xs text-warning bg-warning/20 px-2 py-1 rounded-full">
                              Temporary
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Permanent Notes */}
            {permanentNotes.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Icon name="Save" size={16} className="text-success" />
                  <h4 className="text-sm font-heading-medium text-text-primary">Permanent Notes</h4>
                  <span className="text-xs text-text-secondary bg-success/20 text-success px-2 py-1 rounded-full">
                    {permanentNotes.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {permanentNotes.map(note => (
                    <div key={note.id} className="bg-success/10 border border-success/20 rounded-lg p-3">
                      {editingNote?.id === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-2 py-1 bg-surface-700 border border-border rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleSaveEdit}
                              className="text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="group">
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-text-primary flex-1 whitespace-pre-wrap">{note.content}</p>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNote(note)}
                                iconName="Edit"
                                className="text-xs"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                                iconName="Trash2"
                                className="text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-text-secondary">
                              {formatTime(note.createdAt)}
                            </span>
                            <span className="text-xs text-success bg-success/20 px-2 py-1 rounded-full">
                              Permanent
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Empty State */}
            {sessionNotes.length === 0 && (
              <div className="text-center py-8 text-text-secondary">
                <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notes yet</p>
                <p className="text-xs">Add temporary or permanent notes during your focus session</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionNotes;