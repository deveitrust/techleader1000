using System.Net;
using System.Threading.Tasks;
using DT.Messenger.App.MessengerServices.Dto;
using DT.Messenger.Core.NodeServer.Auth;
using DT.Messenger.Intercommunication;
using DT.Messenger.Intercommunication.Authentication.Dto;
using DT.Messenger.Intercommunication.Authentication.Interfaces;

namespace DT.Messenger.App.MessengerServices.NodeClient
{
    internal interface INodeAppsBase : IAuthDataRetriever
    {
        Task<ResolveNodeOutputDto> GetTargetNodeUrl(long userId);

        Task ConnectNodeAsync(IPAddress nodePublicIpAddress, IConnectNodeRequest request);
        Task<KeepAliveResult> KeepNodeAliveAsync(IPAddress nodePublicIpAddress);

        Task<AuthorizationDto> AuthorizeUserAsync(IPAddress nodePublicIpAddress, int tenantId, long userId);
        Task DisconnectUserAsync(IPAddress nodePublicIpAddress, long userId);

        Task HandleAuthorizationTokenFailed(long userId, string failedBearerToken);
    }
}