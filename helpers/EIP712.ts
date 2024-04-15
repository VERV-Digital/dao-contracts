import {EIP712Domain, EIP712TypeDefinition, HardhatSignerType} from "./EIP712.types"

export async function signTypedData (domain:EIP712Domain, types:EIP712TypeDefinition, values:Object, signer:HardhatSignerType) {
    try {
        return await signer.signTypedData(domain, types, values)
    } catch (error) {
        console.log("[signTypedData]::error ",error )
        return ""
    }
}