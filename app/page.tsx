"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { TextGenerator } from "@/components/text-generator"
import { ImageGenerator } from "@/components/image-generator"
import { FaceSwap } from "@/components/face-swap"
import { VideoGenerator } from "@/components/video-generator"
import { ImageEditor } from "@/components/image-editor"
import { Sparkles, ImageIcon, Users, Settings, Video, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-12">
        <div className="mb-8 text-center sm:mb-12">
          <div className="mb-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex-1" />
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 sm:px-4 sm:py-2 sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              Powered by AI
            </div>
            <div className="flex flex-1 justify-end">
              <Link href="/settings">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>
            </div>
          </div>
          <h1 className="mb-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:mb-4 sm:text-5xl">
            Naughty AI
          </h1>
          <p className="text-pretty text-base text-slate-600 sm:text-lg">
            Generate stunning images, craft compelling text, create videos, and transform faces with cutting-edge AI
          </p>
        </div>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-1 bg-white p-1 shadow-sm">
            <TabsTrigger value="text" className="gap-1 text-xs sm:gap-2 sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Text</span>
              <span className="sm:hidden">Text</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1 text-xs sm:gap-2 sm:text-sm">
              <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Image</span>
              <span className="sm:hidden">Image</span>
            </TabsTrigger>
            <TabsTrigger value="edit" className="gap-1 text-xs sm:gap-2 sm:text-sm">
              <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Edit</span>
              <span className="sm:hidden">Edit</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1 text-xs sm:gap-2 sm:text-sm">
              <Video className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Video</span>
              <span className="sm:hidden">Video</span>
            </TabsTrigger>
            <TabsTrigger value="faceswap" className="gap-1 text-xs sm:gap-2 sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Face</span>
              <span className="sm:hidden">Face</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4 sm:mt-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <TextGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image" className="mt-4 sm:mt-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <ImageGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit" className="mt-4 sm:mt-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <ImageEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video" className="mt-4 sm:mt-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <VideoGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faceswap" className="mt-4 sm:mt-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <FaceSwap />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
