'use client';

import { useState } from 'react';
import { usePhotos, useUploadPhoto, useDeletePhoto } from '@/hooks/usePhotos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Plus, Trash2, Copy, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';

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
        size: 0, // Mock size for now since we're using URLs
      });
      toast.success('Photo added successfully');
      setIsAddOpen(false);
      setNewPhotoUrl('');
      setNewPhotoName('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add photo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    try {
      await deletePhoto(id);
      toast.success('Photo deleted');
      setSelectedPhoto(null);
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Photos</h1>
          <p className="text-neutral-400">Manage images and assets.</p>
        </div>
        
        <Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Dialog.Trigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Photo
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg md:w-full">
              <form onSubmit={handleAddPhoto}>
                <div className="space-y-4">
                  <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                    Add New Photo
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-neutral-400">
                    Provide a public URL and filename to add an asset.
                  </Dialog.Description>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url">Image URL</Label>
                    <Input 
                      id="url" 
                      placeholder="https://example.com/image.jpg" 
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filename">Filename</Label>
                    <Input 
                      id="filename" 
                      placeholder="hero-image.jpg" 
                      value={newPhotoName}
                      onChange={(e) => setNewPhotoName(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isUploading}>
                      Save Photo
                    </Button>
                  </div>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-square animate-pulse rounded-md bg-neutral-800" />
              ))}
            </div>
          ) : photos && photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-md border border-border bg-neutral-900"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={photo.url} 
                    alt={photo.filename}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 flex flex-col justify-end p-2">
                    <p className="truncate text-xs font-medium text-white">{photo.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center text-center">
              <ImageIcon className="mb-4 h-12 w-12 text-neutral-600" />
              <h3 className="mb-2 text-lg font-medium">No photos yet</h3>
              <p className="mb-4 text-sm text-neutral-400">
                Upload your first image asset to start managing your gallery.
              </p>
              <Button variant="outline" onClick={() => setIsAddOpen(true)}>Add Photo</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Detail Modal */}
      <Dialog.Root open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg">
            {selectedPhoto && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 flex items-center justify-center rounded-md border border-border bg-neutral-950 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={selectedPhoto.url} 
                    alt={selectedPhoto.filename}
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold truncate" title={selectedPhoto.filename}>
                      {selectedPhoto.filename}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Added {formatDistanceToNow(new Date(selectedPhoto.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Asset URL</Label>
                    <div className="flex gap-2">
                      <Input value={selectedPhoto.url} readOnly className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(selectedPhoto.url)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <a href={selectedPhoto.url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <Button 
                      variant="destructive" 
                      className="w-full" 
                      onClick={() => handleDelete(selectedPhoto.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Photo
                    </Button>
                  </div>
                  
                  <Button variant="ghost" className="w-full mt-2" onClick={() => setSelectedPhoto(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
