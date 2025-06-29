import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest,res:NextResponse){
    const session=await getServerSession(authOptions)
    if(!session||!session.user){
        return NextResponse.json({msg:"Unauthorized"},{status:411})
    }
    const listOfDocs=await prisma.document.findMany({
        where:{
            owner_id:Number(session.user.id)
        }
    })
    if(!listOfDocs){
        return NextResponse.json({msg:"Nothing found"},{status:411})
    }
    return NextResponse.json({list:listOfDocs},{status:200})
}