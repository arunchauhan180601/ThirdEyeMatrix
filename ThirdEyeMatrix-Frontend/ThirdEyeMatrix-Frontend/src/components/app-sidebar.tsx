"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,   
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"


import { ChevronDown, Users, Package, BarChart2, LayoutDashboard } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

export function AppSidebar() {

    const router = useRouter();
    const pathname = usePathname();
    const { state, setOpen } = useSidebar();

    const expandIfCollapsed = () => {
      if (state === "collapsed") {
        setOpen(true)
      }
    }

    const isPathActive = (slug: string) => {
      if (!pathname) return false
      // Normalize casing and ensure we match the Admin section routes
      const lower = pathname.toLowerCase()
      const target = `/admin/${slug.toLowerCase()}`
      return lower === target || lower.startsWith(`${target}`)
    }
  return (
    <Sidebar collapsible="icon" className="top-16 h-[calc(100vh-4rem)] flex flex-col">
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel >Dashbords</SidebarGroupLabel>

          <SidebarMenu >
            {/* Dashboard Menu */}
             <Collapsible  className="group/collapsible mb-1">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={isPathActive("dashboard")} onClick={()=> { expandIfCollapsed(); router.push("dashboard") }}  className="cursor-pointer" >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard         
                  </SidebarMenuButton>
                </CollapsibleTrigger>                
              </SidebarMenuItem>
            </Collapsible>


            {/* Customers Menu */}
            <Collapsible  className="group/collapsible mb-1">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={isPathActive("customers")} onClick={()=> { expandIfCollapsed(); router.push("customers") }}  className="cursor-pointer" >
                      <Users className="mr-2 h-4 w-4" />
                    Customers          
                  </SidebarMenuButton>
                </CollapsibleTrigger>                
              </SidebarMenuItem>
            </Collapsible>

            {/* Subscription Plans Menu */}
            <Collapsible className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={isPathActive("subscription-plan")} onClick={()=> { expandIfCollapsed(); router.push("subscription-plan") }} className="cursor-pointer">
                     <Package className="mr-2 h-4 w-4" />
                    Subscription Plans                
                  </SidebarMenuButton>
                </CollapsibleTrigger>               
              </SidebarMenuItem>
            </Collapsible>

            {/* Report Menu */}
            <Collapsible className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={isPathActive("report")} onClick={()=> { expandIfCollapsed(); router.push("report") }} className="cursor-pointer">
                     <BarChart2 className="mr-2 h-4 w-4" />
                    Reports
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton onClick={()=> { expandIfCollapsed(); }} >Daily Report</SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton onClick={()=> { expandIfCollapsed(); }} >Monthly Report</SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton onClick={()=> { expandIfCollapsed(); }} >Yearly Report</SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
            
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* User Management Menu (Footer) */}
        <SidebarMenu>
          <Collapsible className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton isActive={isPathActive("users")} onClick={()=> { expandIfCollapsed(); router.push("users") }} className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  User Management
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarMenuSub>
                  {/* Users link */}
                  <SidebarMenuSubItem>
                    <SidebarMenuButton isActive={isPathActive("users")} onClick={()=> { expandIfCollapsed(); router.push("users") }} className="cursor-pointer">Users</SidebarMenuButton>
                  </SidebarMenuSubItem>

                  {/* Roles nested dropdown */}
                  <SidebarMenuSubItem>
                    <Collapsible className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="cursor-pointer">
                          Roles
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>                          
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuButton onClick={()=> { expandIfCollapsed(); router.push("#") }} className="cursor-pointer">Admin</SidebarMenuButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuButton onClick={()=> { expandIfCollapsed(); router.push("#") }} className="cursor-pointer">Manager</SidebarMenuButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuButton onClick={()=> { expandIfCollapsed(); router.push("#") }} className="cursor-pointer">User </SidebarMenuButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
