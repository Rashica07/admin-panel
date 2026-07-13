'use client';

import { useState } from 'react';
import { usePhotos, useUploadPhoto, useDeletePhoto } from '@/hooks/usePhotos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Plus, Trash2, Copy, ExternalLink, Link as LinkIcon, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export default function PhotosPage() {
  const { data: photos, isLoading } = usePhotos();
  const { mutateAsync: uploadPhoto, isPending: isUploading } = useUploadPhoto();
  const { mutateAsync: deletePhoto } = useDeletePhoto();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoName, setNewPhotoName] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl || !newPhotoName) {
      toast.error('Please provide both URL and filename');
      return;
    }
    
    try {
      await uploadPhoto({
        url: newPhotoUrl,
        filename: newPhotoName,
        size: 0,
      });
      toast.success('Asset added successfully');
      setIsAddOpen(false);
      setNewPhotoUrl('');
      setNewPhotoName('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add asset');
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await deletePhoto(id);
      toast.success('Asset deleted');
      if (selectedPhoto?.id === id) {
        setSelectedPhoto(null);
      }
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative">
      
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ImageIcon className="h-7 w-7 text-brand" /> Media Library
          </h1>
          <p className="text-sm text-neutral-400 mt-2">Manage your images, videos, and uploaded assets.</p>
        </div>
        
        <Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Dialog.Trigger asChild>
            <Button className="bg-brand text-black hover:bg-brand-hover gap-2 rounded-full px-5 font-semibold shadow-sm">
              <Plus className="h-4 w-4" /> Add Asset
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border-strong bg-surface p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-2xl md:w-full overflow-hidden">
              <div className="bg-brand/10 border-b border-border/50 p-6 flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center mb-4">
                  <UploadCloud className="h-6 w-6 text-brand" />
                </div>
                <Dialog.Title className="text-xl font-bold text-white">Add New Asset</Dialog.Title>
                <Dialog.Description className="text-sm text-neutral-400 mt-1">Provide a public URL and filename to register a new asset.</Dialog.Description>
              </div>
              <form onSubmit={handleAddPhoto} className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium text-neutral-300">Image URL</Label>
                  <Input 
                    id="url" 
                    placeholder="https://example.com/image.jpg" 
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="h-11 bg-surface-2 border-border-strong rounded-lg focus-visible:ring-brand px-4 text-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filename" className="text-sm font-medium text-neutral-300">Filename</Label>
                  <Input 
                    id="filename" 
                    placeholder="hero-banner.jpg" 
                    value={newPhotoName}
                    onChange={(e) => setNewPhotoName(e.target.value)}
                    className="h-11 bg-surface-2 border-border-strong rounded-lg focus-visible:ring-brand px-4 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Dialog.Close asChild>
                    <Button type="button" variant="ghost" className="rounded-full px-6 hover:bg-neutral-800 text-neutral-300">Cancel</Button>
                  </Dialog.Close>
                  <Button type="submit" disabled={isUploading} className="rounded-full px-8 bg-brand text-black hover:bg-brand-hover font-semibold">
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add Asset
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square bg-surface-2 border border-border animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : photos?.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center np-surface rounded-2xl border-dashed border-2 border-border-strong p-10">
          <div className="h-20 w-20 bg-surface-2 border border-border-strong rounded-full flex items-center justify-center mb-6 shadow-sm">
            <ImageIcon className="h-10 w-10 text-neutral-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No assets yet</h2>
          <p className="text-sm text-neutral-400 max-w-md">Upload your first image to start building your media library. These assets can be used anywhere on your site.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 anim-fade-up">
            {photos?.map((photo: any) => (
              <div 
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-square bg-surface-2 rounded-2xl border border-border-strong overflow-hidden cursor-pointer hover:border-brand/50 transition-colors"
              >
                {/* Image */}
                <img 
                  src={photo.url} 
                  alt={photo.filename} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Glassmorphic Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 backdrop-blur-[2px]">
                  <div className="flex justify-end gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md"
                      onClick={(e) => copyToClipboard(photo.url, e)}
                      title="Copy URL"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="h-8 w-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white border-0 backdrop-blur-md"
                      onClick={(e) => handleDelete(photo.id, e)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  <div className="translate-y-[10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                    <p className="text-sm font-medium text-white truncate drop-shadow-md">{photo.filename}</p>
                    <p className="text-[10px] text-neutral-300 mt-1 font-mono uppercase tracking-widest">{formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Drawer / Modal */}
      <Dialog.Root open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-border bg-surface shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:w-[400px] flex flex-col">
            {selectedPhoto && (
              <>
                <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
                  <Dialog.Title className="text-lg font-bold text-white">Asset Details</Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-neutral-800">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </Button>
                  </Dialog.Close>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <div className="bg-surface-2 border border-border-strong rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                    <img 
                      src={selectedPhoto.url} 
                      alt={selectedPhoto.filename} 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Filename</h4>
                      <p className="text-sm font-medium text-white bg-surface-2 border border-border px-3 py-2 rounded-lg break-all">
                        {selectedPhoto.filename}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Public URL</h4>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={selectedPhoto.url} 
                          readOnly 
                          className="h-10 bg-surface-2 border-border text-xs font-mono"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="shrink-0 h-10 w-10 bg-surface-2 border-border hover:bg-neutral-800 text-neutral-300"
                          onClick={() => copyToClipboard(selectedPhoto.url)}
                          title="Copy URL"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Uploaded</h4>
                      <p className="text-sm text-neutral-300">
                        {new Date(selectedPhoto.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-border/50 bg-surface-2/30 shrink-0 flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-border-strong bg-surface-2 hover:bg-surface-3 hover:text-white"
                    onClick={() => window.open(selectedPhoto.url, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="shrink-0 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20"
                    onClick={(e) => handleDelete(selectedPhoto.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
