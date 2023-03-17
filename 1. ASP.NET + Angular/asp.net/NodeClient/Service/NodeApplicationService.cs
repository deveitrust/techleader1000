using System;
using System.Net;
using System.Threading.Tasks;
using Abp;
using Abp.Application.Features;
using Abp.Auditing;
using Abp.Authorization;
using Abp.Runtime.Session;
using Castle.Core.Logging;
using DT.Messenger.App.MessengerServices.Dto;
using DT.Messenger.Core.NodeServer.Auth;
using DT.Messenger.Features;
using DT.Messenger.Intercommunication;
using DT.Messenger.Intercommunication.Authentication.Dto;
using DT.Messenger.Intercommunication.Authentication.Interfaces;
using DT.Messenger.Messengers.Accounts.Dto;
using JetBrains.Annotations;

namespace DT.Messenger.App.MessengerServices.NodeClient
{
    [AbpAuthorize]
    public class NodeApplicationService : INodeApplicationService
    {
        private readonly IAbpSession _abpSession;
        private readonly INodeAppFacade _nodeAppFacade;
        private readonly IClientInfoProvider _clientInfoProvider;

        public NodeApplicationService(
            IAbpSession abpSession,
            INodeAppFacade nodeAppFacade,
            IClientInfoProvider clientInfoProvider
        )
        {
            _abpSession = abpSession;
            _nodeAppFacade = nodeAppFacade;
            _clientInfoProvider = clientInfoProvider;
            Logger = NullLogger.Instance;
        }

        public ILogger Logger { get; set; }

        private INodeAppService Base => this;
        private long UserId => _abpSession.GetUserId();
        private int TenantId => _abpSession.GetTenantId();

        public Task Ping()
        {
            return Task.CompletedTask;
        }

        [RequiresFeature(MessengerFeatures.MessengerFeature)]
        public Task<ResolveNodeOutputDto> GetTargetNodeUrl()
        {
            return _nodeAppFacade.GetTargetNodeUrl(UserId);
        }

        [AbpAllowAnonymous]
        public Task ConnectNodeAsync([NotNull] ConnectNodeRequest request)
        {
            Check.NotNull(request, nameof(request));
            return Base.ConnectNodeAsync(request);
        }

        Task INodeAppService.ConnectNodeAsync(IConnectNodeRequest request)
        {
            return _nodeAppFacade.ConnectNodeAsync(ClientIpAddressOrThrow, request);
        }

        [AbpAllowAnonymous]
        public Task<KeepAliveResult> KeepNodeAliveAsync()
        {
            return _nodeAppFacade.KeepNodeAliveAsync(ClientIpAddressOrThrow);
        }

        [RequiresFeature(MessengerFeatures.MessengerFeature)]
        public Task<AuthorizationDto> AuthorizeUserAsync()
        {
            return _nodeAppFacade.AuthorizeUserAsync(ClientIpAddressOrThrow, TenantId, UserId);
        }

        [RequiresFeature(MessengerFeatures.MessengerFeature)]
        public Task DisconnectUserAsync()
        {
            return _nodeAppFacade.DisconnectUserAsync(ClientIpAddressOrThrow, UserId);
        }

        [AbpAllowAnonymous]
        public async Task UpdateAuthData(MessengerAuthDataInput authData)
        {
            Check.NotNull(authData, nameof(authData));
            using (_abpSession.Use(null, authData.SiteUserId))
            {
                await Base.UpdateAuthData(authData);
            }
        }

        Task IAuthDataRetriever.UpdateAuthData(IMessengerAuthDataInput authData)
        {
            return _nodeAppFacade.UpdateAuthData(authData);
        }

        [AbpAllowAnonymous]
        public async Task UpdateLastLoginResult(UpdateLastLoginResultDto update)
        {
            Check.NotNull(update, nameof(update));
            using (_abpSession.Use(null, update.SiteUserId))
            {
                await _nodeAppFacade.UpdateLastLoginResult(update);
            }
        }

        [RequiresFeature(MessengerFeatures.MessengerFeature)]
        public Task<MessengerAuthOutputDto> GetAuthData(int authId)
        {
            return _nodeAppFacade.GetAuthData(authId);
        }

        private IPAddress ClientIpAddressOrThrow
        {
            get
            {
                var clientIpAddress = _clientInfoProvider.ClientIpAddress;
                if (IPAddress.TryParse(clientIpAddress, out var ipAddress))
                {
                    return ipAddress;
                }

                Logger.Fatal($"Hosting manager connection error. Ip address: {clientIpAddress ?? "null"}");
                throw new UnauthorizedAccessException();
            }
        }
    }
}