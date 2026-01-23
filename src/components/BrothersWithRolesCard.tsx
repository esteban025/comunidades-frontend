import type { RolesBrothers } from "@/types/brothers"
import { actions } from "astro:actions"
import { useEffect, useState } from "react"

export const BrothersWithRolesCard = ({ commId }: { commId: number }) => {
  const [groupLeaders, setGroupLeaders] = useState<RolesBrothers[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBrothers = async () => {
      try {
        const { data, error } = await actions.getBrothersByCommunity({ community_id: commId })

        if (!data?.success || error) {
          console.error("Error fetching brothers:", data?.message || error?.message)
          return
        }
        const brothers = data.data || []
        setGroupLeaders(brothers)
      } catch (error) {
        console.error('Error no calclado', error)
      }
    }
    fetchBrothers()
  }, [commId])

  return (
    <div>
      {
        groupLeaders.map(bro => (
          <p key={bro.id}>
            <span>{bro.names}</span>
          </p>
        ))
      }
    </div>
  )
}