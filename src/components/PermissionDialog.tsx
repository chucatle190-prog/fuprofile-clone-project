import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PermissionDialogProps {
  open: boolean;
  onClose: () => void;
  permissionType: 'audio' | 'video' | 'both';
}

export const PermissionDialog = ({ open, onClose, permissionType }: PermissionDialogProps) => {
  const getPermissionText = () => {
    switch (permissionType) {
      case 'audio':
        return 'microphone';
      case 'video':
        return 'camera';
      case 'both':
        return 'microphone và camera';
    }
  };

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return (
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Nhấp vào biểu tượng <strong>khóa</strong> hoặc <strong>thông tin</strong> bên trái thanh địa chỉ</li>
          <li>Tìm mục "Quyền" hoặc "Permissions"</li>
          <li>Bật quyền truy cập {getPermissionText()}</li>
          <li>Tải lại trang và thử lại</li>
        </ol>
      );
    } else if (userAgent.includes('firefox')) {
      return (
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Nhấp vào biểu tượng <strong>khóa</strong> bên trái thanh địa chỉ</li>
          <li>Chọn "Kết nối an toàn" → "Thông tin thêm"</li>
          <li>Vào tab "Quyền" và bật {getPermissionText()}</li>
          <li>Tải lại trang và thử lại</li>
        </ol>
      );
    } else if (userAgent.includes('safari')) {
      return (
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Vào <strong>Safari</strong> → <strong>Cài đặt cho trang web này</strong></li>
          <li>Tìm phần {getPermissionText()}</li>
          <li>Chọn "Cho phép"</li>
          <li>Tải lại trang và thử lại</li>
        </ol>
      );
    } else {
      return (
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Tìm biểu tượng cài đặt trên thanh địa chỉ</li>
          <li>Cho phép truy cập {getPermissionText()}</li>
          <li>Tải lại trang và thử lại</li>
        </ol>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Cần cấp quyền truy cập
          </DialogTitle>
          <DialogDescription>
            Bạn cần cho phép truy cập {getPermissionText()} để thực hiện cuộc gọi.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <strong>Hướng dẫn cấp quyền:</strong>
            <div className="mt-3">
              {getBrowserInstructions()}
            </div>
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Đóng
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full sm:w-auto"
          >
            Tải lại trang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
