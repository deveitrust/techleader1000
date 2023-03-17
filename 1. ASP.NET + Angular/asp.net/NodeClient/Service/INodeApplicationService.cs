using System.Threading.Tasks;
using Abp.Application.Services;
using DT.Messenger.App.MessengerServices.Dto;
using DT.Messenger.Intercommunication;

namespace DT.Messenger.App.MessengerServices.NodeClient
{
    public interface INodeApplicationService 
        : IApplicationService
        , INodeAppService
    {
        Task Ping();
        Task<ResolveNodeOutputDto> GetTargetNodeUrl();
    }
}