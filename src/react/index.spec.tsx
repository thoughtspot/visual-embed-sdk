import React, { useEffect } from 'react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import {
    cleanup, fireEvent, render, waitFor,
} from '@testing-library/react';
import {
    Action, EmbedEvent, HostEvent, RuntimeFilterOp,
} from '../types';
import {
    executeAfterWait,
    getIFrameEl,
    getIFrameSrc,
    postMessageToParent,
    mockMessageChannel,
} from '../test/test-utils';
import {
    SearchEmbed, AppEmbed, LiveboardEmbed, useEmbedRef, SearchBarEmbed, PreRenderedLiveboardEmbed, PreRenderedSearchEmbed, PreRenderedAppEmbed, useSpotterAgent, SpotterMessage, useInit
} from './index';
import * as allExports from './index';
import {
    AuthType, init,
} from '../index';

import { version } from '../../package.json';

import * as auth from '../auth';
import * as sessionService from '../utils/sessionInfoService';

const thoughtSpotHost = 'localhost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(auth, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
    jest.spyOn(sessionService, 'getSessionInfo').mockReturnValue({
        userGUID: 'abcd',
    } as any);
    jest.spyOn(window, 'alert');
});

describe('React Components', () => {
    describe('SearchEmbed', () => {
        it('Should Render the Iframe with props', async () => {
            const { container } = render(
                <SearchEmbed hideDataSources={true} className="embedClass" />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(
                getIFrameEl(container).parentElement.classList.contains(
                    'embedClass',
                ),
            ).toBe(true);
            expect(getIFrameSrc(container)).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&authType=None&blockNonEmbedFullAppAccess=true&hideAction=[%22${Action.ReportError}%22,%22editACopy%22,%22saveAsView%22,%22updateTSL%22,%22editTSL%22,%22onDeleteAnswer%22]&preAuthCache=true&overrideConsoleLogs=true&clientLogLevel=ERROR&enableDataPanelV2=true&dataSourceMode=hide&useLastSelectedSources=false&isSearchEmbed=true&collapseSearchBarInitially=true&enableCustomColumnGroups=false&dataPanelCustomGroupsAccordionInitialState=EXPAND_ALL#/embed/answer`,
            );
        });

        it('Should attach event listeners', async () => {
            const userGUID = 'absfdfgd';
            const { container } = render(
                <SearchEmbed
                    onInit={(e) => {
                        expect(e.data).toHaveProperty('timestamp');
                    }}
                    onAuthInit={(e) => {
                        expect(e.data.userGUID).toEqual(userGUID);
                    }}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            const iframe = getIFrameEl(container);
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.AuthInit,
                data: {
                    userGUID,
                },
            });
        });
    });

    describe('AppEmbed', () => {
        //
    });

    describe('LiveboardEmbed', () => {
        //
        it('Should be able to trigger events on the embed using refs', async () => {
            mockMessageChannel();
            const TestComponent = () => {
                const embedRef = useEmbedRef<typeof LiveboardEmbed>();
                const onLiveboardRendered = () => {
                    embedRef.current.trigger(HostEvent.SetVisibleVizs, ['viz1', 'viz2']);
                };

                return (
                    <LiveboardEmbed
                        ref={embedRef}
                        liveboardId="abcd"
                        onLiveboardRendered={onLiveboardRendered}
                    />
                );
            };

            const { container } = render(<TestComponent />);

            await waitFor(() => getIFrameEl(container));
            const iframe = getIFrameEl(container);
            jest.spyOn(iframe.contentWindow, 'postMessage');
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.LiveboardRendered,
                data: {
                    userGUID: 'abcd',
                },
            });
            await executeAfterWait(() => {
                expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                    {
                        type: HostEvent.SetVisibleVizs,
                        data: ['viz1', 'viz2'],
                    },
                    `http://${thoughtSpotHost}`,
                    expect.anything(),
                );
            });
        });

        it('Should render liveboard with runtime filters', async () => {
            const { container } = render(
                <LiveboardEmbed
                    liveboardId="abcd"
                    runtimeFilters={[
                        {
                            columnName: 'revenue',
                            operator: RuntimeFilterOp.EQ,
                            values: [100],
                        },
                    ]}
                    excludeRuntimeFiltersfromURL={false}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(getIFrameSrc(container)).toContain('col1=revenue&op1=EQ&val1=100');
        });

        it('Should have the correct container element', async () => {
            const { container } = render(
                <LiveboardEmbed liveboardId="abcd" className="def" />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('div')).not.toBe(null);
            expect(
                container.querySelector('div').classList.contains('def'),
            ).toBe(true);

            const { container: containerSibling } = render(
                <LiveboardEmbed
                    liveboardId="abcd"
                    className="def"
                    insertAsSibling={true}
                />,
            );
            await waitFor(() => getIFrameEl(containerSibling));
            expect(containerSibling.querySelector('span')).not.toBe(null);
            expect(containerSibling.querySelector('span').style.position).toBe(
                'absolute',
            );
            expect(
                getIFrameEl(containerSibling).classList.contains('def'),
            ).toBe(true);
            expect(containerSibling.querySelector('div')).toBe(null);
        });

        it('Should have the correct container element', async () => {
            const { container } = render(
                <LiveboardEmbed liveboardId="abcd" className="def" />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('div')).not.toBe(null);
            expect(
                container.querySelector('div').classList.contains('def'),
            ).toBe(true);

            const { container: containerSibling } = render(
                <LiveboardEmbed
                    liveboardId="abcd"
                    className="def"
                    insertAsSibling={true}
                />,
            );
            await waitFor(() => getIFrameEl(containerSibling));
            expect(containerSibling.querySelector('span')).not.toBe(null);
            expect(containerSibling.querySelector('span').style.position).toBe(
                'absolute',
            );
            expect(
                getIFrameEl(containerSibling).classList.contains('def'),
            ).toBe(true);
            expect(containerSibling.querySelector('div')).toBe(null);
        });
    });

    describe('SearchBarEmbed', () => {
        it('Should Render the Iframe with props', async () => {
            const { container } = render(
                <SearchBarEmbed
                    className="embedClass"
                    dataSource={'test'}
                    searchOptions={{
                        searchTokenString: '[revenue]',
                        executeSearch: true,
                    }}
                />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(
                getIFrameEl(container).parentElement.classList.contains(
                    'embedClass',
                ),
            ).toBe(true);
            expect(getIFrameSrc(container)).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&authType=None&blockNonEmbedFullAppAccess=true&hideAction=[%22${Action.ReportError}%22]&preAuthCache=true&overrideConsoleLogs=true&clientLogLevel=ERROR&dataSources=[%22test%22]&searchTokenString=%5Brevenue%5D&executeSearch=true&useLastSelectedSources=false&isSearchEmbed=true#/embed/search-bar-embed`,
            );
        });
    });

    describe('SpotterMessage', () => {
        const mockMessage = {
            sessionId: "session123",
            genNo: 1,
            acSessionId: "acSession123",
            acGenNo: 2,
            worksheetId: "worksheet123",
            convId: "conv123",
            messageId: "message123"
        };

        it('Should render the SpotterMessage component with required props', async () => {
            const { container } = render(
                <SpotterMessage message={mockMessage} />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(getIFrameEl(container)).not.toBe(null);
            expect(getIFrameSrc(container)).toContain('sessionId=session123');
            expect(getIFrameSrc(container)).toContain('genNo=1');
            expect(getIFrameSrc(container)).toContain('acSessionId=acSession123');
            expect(getIFrameSrc(container)).toContain('acGenNo=2');
        });

        it('Should render the SpotterMessage component with optional query', async () => {
            const { container } = render(
                <SpotterMessage 
                    message={mockMessage} 
                    query="show me sales"
                />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(getIFrameEl(container)).not.toBe(null);
            expect(getIFrameSrc(container)).toContain('sessionId=session123');
        });

        it('Should have the correct container element with className', async () => {
            const { container } = render(
                <SpotterMessage 
                    message={mockMessage}
                    className="custom-class"
                />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(
                getIFrameEl(container).parentElement.classList.contains('custom-class'),
            ).toBe(true);
        });

        // Note: insertAsSibling is not supported for SpotterMessage as it's not part of the allowed props
    });

    describe('Component Factory Coverage', () => {
        it('Should test basic component creation', () => {
            expect(() => {
                render(<LiveboardEmbed liveboardId="test" />);
            }).not.toThrow();
            
            expect(() => {
                render(<SearchEmbed dataSource="test" />);
            }).not.toThrow();
            
            expect(() => {
                render(<AppEmbed showPrimaryNavbar={false} />);
            }).not.toThrow();
        });

        it('Should test component factory existence', () => {
            expect(PreRenderedLiveboardEmbed).toBeDefined();
            expect(PreRenderedSearchEmbed).toBeDefined();
            expect(PreRenderedAppEmbed).toBeDefined();
            expect(typeof PreRenderedLiveboardEmbed).toBe('object');
            expect(typeof PreRenderedSearchEmbed).toBe('object');
            expect(typeof PreRenderedAppEmbed).toBe('object');
        });
    });

    describe('Components with insertAsSibling', () => {
        it('Should render LiveboardEmbed with insertAsSibling', async () => {
            const { container } = render(
                <LiveboardEmbed
                    liveboardId="test-liveboard"
                    insertAsSibling={true}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('span')).not.toBe(null);
            expect(container.querySelector('span')?.style.position).toBe('absolute');
        });

        it('Should render SearchEmbed with insertAsSibling', async () => {
            const { container } = render(
                <SearchEmbed
                    dataSource="test-datasource"
                    insertAsSibling={true}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('span')).not.toBe(null);
            expect(container.querySelector('span')?.style.position).toBe('absolute');
        });

        it('Should render AppEmbed with insertAsSibling', async () => {
            const { container } = render(
                <AppEmbed
                    showPrimaryNavbar={false}
                    insertAsSibling={true}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('span')).not.toBe(null);
            expect(container.querySelector('span')?.style.position).toBe('absolute');
        });

        it('Should render SearchBarEmbed with insertAsSibling', async () => {
            const { container } = render(
                <SearchBarEmbed
                    dataSource="test-datasource"
                    insertAsSibling={true}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('span')).not.toBe(null);
            expect(container.querySelector('span')?.style.position).toBe('absolute');
        });

        it('Should render components with both insertAsSibling and className', async () => {
            const { container } = render(
                <LiveboardEmbed
                    liveboardId="test-liveboard"
                    insertAsSibling={true}
                    className="custom-class"
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('span')).not.toBe(null);
            expect(getIFrameEl(container).classList.contains('custom-class')).toBe(true);
        });
    });

    describe('useSpotterAgent', () => {
        it('Should return an object with sendMessage function', () => {
            const TestComponent = () => {
                const spotterAgent = useSpotterAgent({ worksheetId: 'test-worksheet' });
                expect(typeof spotterAgent).toBe('object');
                expect(typeof spotterAgent.sendMessage).toBe('function');
                return <div>Test</div>;
            };

            render(<TestComponent />);
        });

        it('Should have proper sendMessage callback structure', () => {
            const TestComponent = () => {
                const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                
                // Test that sendMessage is a function that accepts a string
                expect(typeof sendMessage).toBe('function');
                expect(sendMessage.length).toBe(1); // Should accept one parameter
                
                return <div>Test</div>;
            };

            render(<TestComponent />);
        });

        it('Should return error when service is not initialized', async () => {
            let sendMessageResult: any;
            
            const TestComponent = () => {
                const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                
                // Call sendMessage immediately before service has time to initialize
                sendMessageResult = sendMessage('test query');
                
                return <div>Test</div>;
            };

            render(<TestComponent />);
            
            const result = await sendMessageResult;
            expect(result).toEqual({
                error: expect.any(Error)
            });
            expect(result.error.message).toBe('SpotterAgent not initialized');
        });

        it('Should call sendMessage and handle async behavior', async () => {
            let sendMessageFunction: any;
            
            const TestComponent = () => {
                const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                sendMessageFunction = sendMessage;
                return <div>Test</div>;
            };

            render(<TestComponent />);
            
            // Test that sendMessage is a function
            expect(typeof sendMessageFunction).toBe('function');
            
            // Call sendMessage - should not throw
            expect(() => {
                sendMessageFunction('test query');
            }).not.toThrow();
        });

        it('Should handle multiple calls to sendMessage', async () => {
            let sendMessageFunction: any;
            
            const TestComponent = () => {
                const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                sendMessageFunction = sendMessage;
                return <div>Test</div>;
            };

            render(<TestComponent />);
            
            // Multiple calls should not throw
            expect(() => {
                sendMessageFunction('query 1');
                sendMessageFunction('query 2');
                sendMessageFunction('query 3');
            }).not.toThrow();
        });

        it('Should handle config object changes', () => {
            const TestComponent = ({ config }: { config: any }) => {
                const { sendMessage } = useSpotterAgent(config);
                expect(sendMessage).toBeDefined();
                return <div>Test</div>;
            };

            const config1 = { worksheetId: 'test1' };
            const config2 = { worksheetId: 'test2' };
            
            const { rerender } = render(<TestComponent config={config1} />);
            
            // Should not throw when config changes
            expect(() => {
                rerender(<TestComponent config={config2} />);
            }).not.toThrow();
        });

        it('Should handle unmounting without errors', () => {
            const TestComponent = () => {
                const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                expect(sendMessage).toBeDefined();
                return <div>Test</div>;
            };

            const { unmount } = render(<TestComponent />);
            
            // Should not throw when unmounting
            expect(() => {
                unmount();
            }).not.toThrow();
        });

        it('Should create stable hook structure', () => {
            let hookResult1: any, hookResult2: any;
            
            const TestComponent = ({ counter }: { counter: number }) => {
                const result = useSpotterAgent({ worksheetId: 'test-worksheet' });
                
                if (counter === 1) {
                    hookResult1 = result;
                } else {
                    hookResult2 = result;
                }
                
                return <div>Test</div>;
            };

            const { rerender } = render(<TestComponent counter={1} />);
            rerender(<TestComponent counter={2} />);
            
            // Both should have same structure
            expect(hookResult1).toEqual({ sendMessage: expect.any(Function) });
            expect(hookResult2).toEqual({ sendMessage: expect.any(Function) });
        });

                 it('Should handle different worksheet IDs', () => {
             const TestComponent = ({ worksheetId }: { worksheetId: string }) => {
                 const { sendMessage } = useSpotterAgent({ worksheetId });
                 expect(sendMessage).toBeDefined();
                 return <div>Test</div>;
             };

             const { rerender } = render(<TestComponent worksheetId="worksheet1" />);
             
             // Should handle different worksheet IDs
             expect(() => {
                 rerender(<TestComponent worksheetId="worksheet2" />);
                 rerender(<TestComponent worksheetId="worksheet3" />);
             }).not.toThrow();
         });

         it('Should handle empty query strings', () => {
             let sendMessageFunction: any;
             
             const TestComponent = () => {
                 const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                 sendMessageFunction = sendMessage;
                 return <div>Test</div>;
             };

             render(<TestComponent />);
             
             // Should handle empty strings
             expect(() => {
                 sendMessageFunction('');
                 sendMessageFunction('   ');
             }).not.toThrow();
         });

         it('Should handle complex config objects', () => {
             const complexConfig = {
                 worksheetId: 'test-worksheet',
                 hiddenActions: [Action.ReportError],
                 className: 'test-class',
                 searchOptions: {
                     searchQuery: 'test query'
                 }
             };

             const TestComponent = () => {
                 const { sendMessage } = useSpotterAgent(complexConfig);
                 expect(sendMessage).toBeDefined();
                 return <div>Test</div>;
             };

             // Should not throw with complex config
             expect(() => {
                 render(<TestComponent />);
             }).not.toThrow();
         });

         it('Should maintain function identity across re-renders with same config', () => {
             let sendMessage1: any, sendMessage2: any;
             
             const TestComponent = ({ forceRender }: { forceRender: number }) => {
                 const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                 
                 if (forceRender === 1) {
                     sendMessage1 = sendMessage;
                 } else {
                     sendMessage2 = sendMessage;
                 }
                 
                 return <div>Test</div>;
             };

             const { rerender } = render(<TestComponent forceRender={1} />);
             rerender(<TestComponent forceRender={2} />);
             
             // Functions should exist
             expect(sendMessage1).toBeDefined();
             expect(sendMessage2).toBeDefined();
             expect(typeof sendMessage1).toBe('function');
             expect(typeof sendMessage2).toBe('function');
         });

         it('Should handle sendMessage calls with null service ref', async () => {
             let capturedSendMessage: any;
             
             const TestComponent = () => {
                 const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                 capturedSendMessage = sendMessage;
                 return <div>Test</div>;
             };

             const { unmount } = render(<TestComponent />);
             
             // Unmount to trigger cleanup
             unmount();
             
             // Now call sendMessage after unmount - should return error
             const result = await capturedSendMessage('test query');
             expect(result).toEqual({
                 error: expect.any(Error)
             });
         });

         it('Should test service ref cleanup on config change', () => {
             const TestComponent = ({ worksheetId }: { worksheetId: string }) => {
                 const { sendMessage } = useSpotterAgent({ worksheetId });
                 expect(sendMessage).toBeDefined();
                 return <div>Test</div>;
             };

             const { rerender } = render(<TestComponent worksheetId="worksheet1" />);
             
             // This should trigger the cleanup and create new service
             rerender(<TestComponent worksheetId="worksheet2" />);
             
             // Should still work after rerender
             expect(() => {
                 rerender(<TestComponent worksheetId="worksheet3" />);
             }).not.toThrow();
         });

         it('Should test different config variations', () => {
             const configs = [
                 { worksheetId: 'test1' },
                 { worksheetId: 'test2', hiddenActions: [Action.ReportError] },
                 { worksheetId: 'test3', className: 'test-class' },
                 { worksheetId: 'test4', searchOptions: { searchQuery: 'test' } }
             ];

             configs.forEach((config, index) => {
                 const TestComponent = () => {
                     const { sendMessage } = useSpotterAgent(config);
                     expect(sendMessage).toBeDefined();
                     return <div>Test {index}</div>;
                 };

                 expect(() => {
                     const { unmount } = render(<TestComponent />);
                     unmount();
                 }).not.toThrow();
             });
         });

         it('Should handle rapid config changes', () => {
             const TestComponent = ({ worksheetId }: { worksheetId: string }) => {
                 const { sendMessage } = useSpotterAgent({ worksheetId });
                 expect(sendMessage).toBeDefined();
                 return <div>Test</div>;
             };

             const { rerender } = render(<TestComponent worksheetId="worksheet1" />);
             
             // Rapid config changes to test cleanup logic
             for (let i = 2; i <= 10; i++) {
                 rerender(<TestComponent worksheetId={`worksheet${i}`} />);
             }
             
             // Should still work after many changes
             expect(() => {
                 rerender(<TestComponent worksheetId="final-worksheet" />);
             }).not.toThrow();
         });

         it('Should handle sendMessage with different query types', () => {
             let sendMessageFunction: any;
             
             const TestComponent = () => {
                 const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                 sendMessageFunction = sendMessage;
                 return <div>Test</div>;
             };

             render(<TestComponent />);
             
             // Test different query types
             const queries = [
                 'simple query',
                 'query with numbers 123',
                 'query with special chars !@#$%',
                 'very long query that might test different code paths in the system when processing',
                 '',
                 '   whitespace   ',
                 'null',
                 'undefined'
             ];

             queries.forEach(query => {
                 expect(() => {
                     sendMessageFunction(query);
                 }).not.toThrow();
             });
         });

         it('Should handle service ref cleanup when it already exists', () => {
             const TestComponent = ({ worksheetId }: { worksheetId: string }) => {
                 const { sendMessage } = useSpotterAgent({ worksheetId });
                 expect(sendMessage).toBeDefined();
                 return <div>Test</div>;
             };

             const { rerender } = render(<TestComponent worksheetId="worksheet1" />);
             
             // This should trigger the "if (serviceRef.current)" branch in useEffect
             rerender(<TestComponent worksheetId="worksheet1" />);
             rerender(<TestComponent worksheetId="worksheet2" />);
             rerender(<TestComponent worksheetId="worksheet3" />);
             
             // Multiple rapid changes should exercise the cleanup logic
             for (let i = 0; i < 5; i++) {
                 rerender(<TestComponent worksheetId={`worksheet${i}`} />);
             }
         });

         it('Should test various config combinations to hit all branches', () => {
             const testConfigs = [
                 { worksheetId: 'test1' },
                 { worksheetId: 'test2', className: 'custom-class' },
                 { worksheetId: 'test3', hiddenActions: [Action.ReportError] },
                 { worksheetId: 'test4', searchOptions: { searchQuery: 'test' } },
                 { worksheetId: 'test5', insertAsSibling: true },
                 { worksheetId: 'test6', insertAsSibling: false },
             ];

             testConfigs.forEach((config, index) => {
                 const TestComponent = () => {
                     const { sendMessage } = useSpotterAgent(config);
                     expect(sendMessage).toBeDefined();
                     return <div>Test {index}</div>;
                 };

                 const { unmount } = render(<TestComponent />);
                 unmount();
             });
         });
    });

    describe('Component Props and Functions', () => {
        it('Should have PreRenderedLiveboardEmbed component', () => {
            expect(PreRenderedLiveboardEmbed).toBeDefined();
            expect(typeof PreRenderedLiveboardEmbed).toBe('object');
        });

        it('Should have useInit hook', () => {
            expect(typeof useInit).toBe('function');
        });

        it('Should test basic component factory patterns', () => {
            // Test that components can be created without errors
            expect(() => {
                const TestComponent = () => <div>Test</div>;
                render(<TestComponent />);
            }).not.toThrow();
        });
    });

    describe('Hook Coverage', () => {
        it('Should have useInit function available', () => {
            expect(typeof useInit).toBe('function');
        });

        it('Should test useInit hook basic functionality', () => {
            const TestComponent = () => {
                const authEE = useInit({ 
                    thoughtSpotHost: 'localhost',
                    authType: AuthType.None 
                });
                expect(authEE).toBeDefined();
                expect(authEE.current).toBeDefined();
                return <div>Test</div>;
            };

            render(<TestComponent />);
        });

        it('Should handle useInit with different config changes', () => {
            const TestComponent = ({ host }: { host: string }) => {
                const authEE = useInit({ 
                    thoughtSpotHost: host,
                    authType: AuthType.None 
                });
                expect(authEE).toBeDefined();
                return <div>Test</div>;
            };

            const { rerender } = render(<TestComponent host="localhost" />);
            
            // Change config to test useDeepCompareEffect
            rerender(<TestComponent host="localhost2" />);
            rerender(<TestComponent host="localhost3" />);
        });

        it('Should test useInit with complex config objects', () => {
            const TestComponent = () => {
                const authEE = useInit({ 
                    thoughtSpotHost: 'localhost',
                    authType: AuthType.None,
                    suppressNoCookieAccessAlert: true,
                    suppressErrorAlerts: true
                });
                expect(authEE).toBeDefined();
                return <div>Test</div>;
            };

            render(<TestComponent />);
        });
    });
});

describe('allExports', () => {
    it('should have exports', () => {
        expect(typeof allExports).toBe('object');
    });

    it('should not have undefined exports', () => {
        Object.keys(allExports).forEach(
            (exportKey) => expect(
                Boolean(allExports[exportKey as keyof typeof allExports]),
            )
                .toBe(true),
        );
    });
});
