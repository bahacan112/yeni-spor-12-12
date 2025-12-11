"use client"

import { useState } from "react"
import { Search, Plus, MoreHorizontal, Shield, UserCheck, UserX, Mail, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User } from "@/lib/types"

interface UsersClientProps {
  initialUsers: User[]
}

const roleColors: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-500",
  support: "bg-blue-500/10 text-blue-500",
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  support: "Destek",
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // Note: Since this is just a client-side filter, it doesn't do real search.
  // In a real app we'd likely want server-side search.
  const filteredUsers = initialUsers.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kullanıcılar</h1>
          <p className="text-sm text-slate-400">Platform yönetici kullanıcıları</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kullanıcı
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Kullanıcı Ekle</DialogTitle>
              <DialogDescription className="text-slate-400">
                Platform yönetim paneline erişim yetkisi verin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Ad Soyad</Label>
                <Input placeholder="Kullanıcı adı" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">E-posta</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Rol</Label>
                <Select>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="support">Destek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="text-slate-400">
                İptal
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Kullanıcı Ekle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Kullanıcı ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-800 text-white"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatarUrl || `/.jpg?height=48&width=48&query=${user.fullName}`} />
                <AvatarFallback className="bg-slate-700 text-white">
                  {user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white">{user.fullName}</h3>
                  {!user.isActive && (
                    <Badge variant="secondary" className="bg-slate-700 text-slate-400 text-xs">
                      Pasif
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400">{user.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={roleColors[user.role] || "bg-slate-500/10 text-slate-500"}>
                    <Shield className="mr-1 h-3 w-3" />
                    {roleLabels[user.role] || user.role}
                  </Badge>
                  {user.lastLoginAt && (
                    <span className="text-xs text-slate-500">
                        Son giriş: {new Date(user.lastLoginAt).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                <DropdownMenuItem className="text-slate-300 focus:bg-slate-700">
                  <Key className="mr-2 h-4 w-4" />
                  Şifre Sıfırla
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-300 focus:bg-slate-700">
                  <Mail className="mr-2 h-4 w-4" />
                  E-posta Gönder
                </DropdownMenuItem>
                {user.isActive ? (
                  <DropdownMenuItem className="text-red-400 focus:bg-slate-700">
                    <UserX className="mr-2 h-4 w-4" />
                    Pasif Yap
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="text-green-400 focus:bg-slate-700">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Aktif Yap
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  )
}
